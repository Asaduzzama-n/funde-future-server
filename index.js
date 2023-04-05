const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require("nodemailer");
const mg = require('nodemailer-mailgun-transport');

require('dotenv').config();
const stripe = require("stripe")("sk_test_51MsoefLLZ1o50Tb07lZcDPmFuo1mVf4QDfl7Yy8imWJ14fltPh1SM42yrilwK3G4NMJdoGfwoRAhbgd6XRDtyJMP00QtCpZuIp");

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.wd2bc6v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




function sendInvoiceEmail(donation) {

    const {donor_mail,amount,transactionId,campaign_id} = donation;

    const auth = {
        auth: {
          api_key: process.env.EMAIL_SEND_KEY,
          domain: process.env.EMAIL_DOMAIN
        }
      }
      
      const transporter = nodemailer.createTransport(mg(auth));

      transporter.sendMail({
        from: "asaduzzaman193146@gmail.com", // verified sender email
        to: donor_mail || 'asadshanto310@gmail.com', // recipient email
        subject: `Thank your for your donation`, // Subject line
        text: "Hello world!", // plain text body
        html: `
        <div>
            <p>You have donated ${amount} for campaign id: ${campaign_id} </p>
            <p>Transaction ID:  ${transactionId}</p>
        </div>
        
        `, // html body
    }, function (error, info) {
        if (error) {
            console.log('Email send error', error);
        } else {
            console.log('Email sent: ' + info);
        }
    });

}


async function run() {
    try {
        const campaignCollection = client.db("fund-future").collection('Campaigns');
        const donationCollection = client.db("fund-future").collection('Donation');
        const storyCollection = client.db("fund-future").collection('Story');



        //loading all campaign and campaign based on email ... used in campaigns and dashboard ---> myCampaigns
        app.get('/campaigns', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = { campaigner_mail: req.query.email }
            }
            const cursor = campaignCollection.find(query);
            const campaigns = await cursor.toArray();
            res.send(campaigns);
        })




        //getting campaign with donation based on campaigner mail and donor mail
        // app.get('/v2/campaigns',async(req,res)=>{
        //     const campaignsWithDonation = await campaignCollection.aggregate([
        //         {
        //             $lookup:{
        //                 from:'Donation',
        //                 localField: 'campaigner_mail',
        //                 foreignField: 'donor_mail',
        //                 as:'donations'
        //             }
        //         }
        //     ]).toArray();

        //     res.send(campaignsWithDonation);
        //     console.log(campaignsWithDonation);
        // })





        app.get('/campaign/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const campaign = await campaignCollection.findOne(query);
            res.send(campaign);
        })

        //Get featured campaign
        app.get('/campaigns-featured', async (req, res) => {
            const query = { category: 'featured' }
            const campaigns = await campaignCollection.find(query).toArray();

            res.send(campaigns)

        })

        //JWT get all donation and donation based on user email --> used in MyDonation
        app.get('/donations', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = { donor_mail: req.query.email }
            }
            const donations = await donationCollection.find(query).toArray();
            res.send(donations);
        })



        //Get donation by campaign id
        app.get('/donation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { campaign_id: id }
            const cursor = donationCollection.find(query);
            const donation = await cursor.toArray();
            res.send(donation);

        })


        //Get success stories
        app.get('/successStories',async(req,res)=>{
            const query = {};
            const stories =await storyCollection.find(query).toArray();
            res.send(stories);
        })

        //Get success story

        app.get('/successStory/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const story =await storyCollection.findOne(query);
            res.send(story);
        })





        //Post APIs ---------------------------------\'''

        app.post('/campaigns', async (req, res) => {
            const campaign = req.body;
            console.log(campaign);
            const result = await campaignCollection.insertOne(campaign);
            res.send(result);

        })


        //Stripe  donation Intent--->
        app.post('/create-payment-intent', async (req, res) => {
            const donation = req.body;
            const price = donation.d_amount;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        //Donation information post---> donation.js, checkoutForm.js

        app.post('/checkout', async (req, res) => {
            const donation = req.body;
            const result = await donationCollection.insertOne(donation);
            //Send email----> invoice
            sendInvoiceEmail(donation);
            res.send(result);
        })

        //Success Story post------> createStory.js
        app.post('/successStory',async(req,res)=>{
            const story = req.body;
            const result = await storyCollection.insertOne(story);
            res.send(result);
        })


    }
    finally {

    }

}

run().catch(err => console.error(err));








app.listen(port, (port, () => {
    console.log("SERVER IS RUNNING");
}))