const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.wd2bc6v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        const campaignCollection = client.db("fund-future").collection('Campaigns');
        const donationCollection = client.db("fund-future").collection('Donation');
    
        app.get('/campaigns',async(req,res)=>{
            const query = {}
            const cursor = campaignCollection.find(query);
            const campaigns = await cursor.toArray();
            res.send(campaigns);
        })

        app.get('/campaign/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const campaign = await campaignCollection.findOne(query);
            res.send(campaign);
        })

        //Get featured campaign
        app.get('/campaigns-featured',async(req,res)=>{
            const query = {category: 'featured'}
            const campaigns = await campaignCollection.find(query).toArray();

            res.send(campaigns)
   
        })

        //Get all the donation
        app.get('/donation',async(req,res)=>{
            const query = {}
            const cursor =  donationCollection.find(query);
            const donations = await cursor.toArray();
            res.send(donations);
            console.log(donations)
        })

        //Get donation by campaign id
        app.get('/donation/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {campaign_id: id}
            const cursor =  donationCollection.find(query);
            const donation = await cursor.toArray();
            res.send(donation);

        })


        //Post APIs

        app.post('/campaigns',async(req,res)=>{
            const campaign = req.body;
            console.log(campaign);
            const result = await campaignCollection.insertOne(campaign);
            res.send(result);

        })


    }
    finally{
    
    }

}

run().catch(err => console.error(err));








app.listen(port,(port, ()=>{
    console.log("SERVER IS RUNNING");
}))