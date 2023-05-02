const express = require('express');
const cors = require('cors');
const Mailgen = require('mailgen');
const jwt = require('jsonwebtoken');

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

    const { donor_mail, amount, transactionId, campaign_id, campaign_name, donor_name, charity_name } = donation;


    let config = {
        service: 'gmail',
        auth: {
            user: process.env.GOOGLE_EMAIL,
            pass: process.env.GOOGLE_EMAIL_PASS
        }
    }


    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "FundFuture",
            link: 'https://mailgen.js/'
        }
    })

    let response = {
        body: {
            name: donor_name,
            intro: "",
            table: {
                data: [
                    {
                        campaign: campaign_name || charity_name,
                        description: "Thank you for your donation. Wish you all the best!",
                        amount: amount,
                    }
                ]
            },
            outro: "Thank you for being with us!"
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from: process.env.GOOGLE_EMAIL,
        to: donor_mail,
        subject: `You have donated ${amount} to ${campaign_name || charity_name}`,
        html: mail
    }

    transporter.sendMail(message).then(() => {
        // return res.status(201).json({
        //     msg: "you should receive an email"
        // })
    }).catch(error => {
        // return res.status(500).json({ error })
    })

}





//================================
function sendContactMail(mailInfo) {

    const { mailTo, mailBody, mailSubject, mailToName } = mailInfo;


    let config = {
        service: 'gmail',
        auth: {
            user: process.env.GOOGLE_EMAIL,
            pass: process.env.GOOGLE_EMAIL_PASS
        }
    }


    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "FundFuture",
            link: 'https://mailgen.js/'
        }
    })

    let response = {
        body: {
            name: mailToName,
            intro: mailBody,

            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from: process.env.GOOGLE_EMAIL,
        to: mailTo,
        subject: mailSubject,
        html: mail
    }

    transporter.sendMail(message).then(() => {
        // return res.status(201).json({
        //     msg: "you should receive an email"
        // })
    }).catch(error => {
        // return res.status(500).json({ error })
    })

}





function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}



async function run() {
    try {
        const campaignCollection = client.db("fund-future").collection('Campaigns');
        const donationCollection = client.db("fund-future").collection('Donation');
        const storyCollection = client.db("fund-future").collection('Story');
        const userCollection = client.db("fund-future").collection('Users');
        const messageCollection = client.db("fund-future").collection('Messages');
        const donationAuditCollection = client.db("fund-future").collection('donationAudit');



        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.findOne({ email: email });
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' });
        })



        //------------------------------------------------------------------->

        //loading all campaign and campaign based on email ... used in campaigns and dashboard ---> myCampaigns

        app.get('/all-campaigns', async (req, res) => {
            let query = {}
            const cursor = campaignCollection.find(query);
            const campaigns = await cursor.toArray();
            res.send(campaigns);
        })


        app.get('/campaigns', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden-access' })
            }
            const query = { campaigner_mail: email }
            const cursor = campaignCollection.find(query);
            const campaigns = await cursor.toArray();
            res.send(campaigns);
        })

        //get campaign by id
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


        //campaign post
        app.post('/campaigns', async (req, res) => {
            const campaign = req.body;
            console.log(campaign);
            const result = await campaignCollection.insertOne(campaign);
            res.send(result);

        })


        //Campaign Update --->EditPart.js
        app.put('/campaigns/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const campaign = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    title: campaign.title,
                    category: campaign.category,
                    address: campaign.address,
                    short_desc: campaign.short_desc,
                    description: campaign.description,
                    lastModified: new Date()
                }
            }
            const result = await campaignCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        //=================== ADMIN ========================

        app.put('/campaign/admin/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            let end_date = '';
            if (status.status === 'finished') {
                end_date = JSON.stringify(new Date());
            }
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: status.status,
                    end_date: end_date

                }
            }
            const result = await campaignCollection.updateOne(filter, updateDoc, options);
            res.send(result);
            // console.log(id,status);
        })


        //---------------------------------------------------------------------------->



        //Getting all donations information -->|| used in authContext ||
        app.get('/get-donations', async (req, res) => {
            let query = {}
            const donations = await donationCollection.find(query).toArray();
            res.send(donations);
        })

        //JWT get donation based on user email -->|| used in MyDonation ||
        app.get('/donations', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden-access' })
            }
            const query = { donor_mail: email }
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
        //--------------------------------------------------------------------





        //Get success stories
        app.get('/successStories', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = { st_mail: req.query.email }
            }
            const stories = await storyCollection.find(query).toArray();
            res.send(stories);
        })

        //Get success story

        app.get('/successStory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const story = await storyCollection.findOne(query);
            res.send(story);
        })


        //Success Story post------> createStory.js
        app.post('/successStory', async (req, res) => {
            const story = req.body;
            const result = await storyCollection.insertOne(story);
            res.send(result);
        })


        //DELETE APIS
        app.delete('/successStories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await storyCollection.deleteOne(query);
            res.send(result);
        })



        //-----------------------------------------------------------------
        //Get users || used in myProfile.js ||


        app.get('/all-users', async (req, res) => {
            let query = {};
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/users', async (req, res) => {

            const query = { email: req.query.email };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })


        //user save || signup.js ||
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user.email)
            const query = { email: user.email }
            const exists = await userCollection.findOne(query);
            if (!exists) {
                const result = await userCollection.insertOne(user);
                res.send(result);
            } else {
                res.send('already exist!');
            }



        })


        //Get if the user is admin or not || used in useAdmin hook ||
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })


        //UPDATE APIS ---> || myProfile.js||
        app.put('/users', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const user = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    phone: user.phone,
                    profile: user.profile,
                    address: user.address,
                    lastModified: new Date()

                }
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })



        //--------------------------------------------------------------->



        //----|Others|





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


        //send mail to campaigner --->Dashboard -> adminDashboard -> SharedComponent -> UserInfoModal.js
        app.post('/sendEmail', verifyJWT, async (req, res) => {
            const contactMail = req.body;
            // const result = await donationCollection.insertOne(donation);
            //Send email----> invoice
            sendContactMail(contactMail);
            res.send({ send: 'success' });
        })



        //Message

        app.get('/messages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { campaign_id: id };
            const result = await messageCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/message', async (req, res) => {
            const message = req.body;
            const result = await messageCollection.insertOne(message);
            res.send(result);
        })













        const charities = [
            {
                _id: '1',
                title: "As-Sunnah Foundation",
                charity_desc: "As-Sunnah Foundation is a non-profit, non-political, and entirely charitable organization dedicated to human welfare. Following the ideals and footsteps of the teacher of humanity, liberator of mankind, and role model of generosity Prophet Muhammad (Saw), this organization is engaged in social reform, inculcation of great morality, establishing employment, poverty alleviation, low cost or free health care, expansion of Islamic teachings and culture, conducting multidisciplinary education projects, continuous program in building a clean mindset, above all using oral, written and modern media to make people obey Allah and abide by His Messenger (Saw).",
                charity_img: "https://www.ourislam24.com/wp-content/uploads/2021/06/as-sunnah-logo.jpg",
                charity_contact: "+88-09610-001089",
                charity_email: "assunnahfoundationbd@gmail.com",
                charity_campaigns: ['Zakat', 'Orphan Fund', 'Sadaqah Jariyah Fund']
            },
            {
                _id: '2',
                title: "Bidyanondo foundation",
                charity_desc: "A passionate group of people who wishes to inspire a nation and beyond. Bidyanondo is an educational voluntary organization that originated from Bangladesh. The official registration No. is S-12258/2015). Bidyanondo has been operated by 40 professionals and with help of thousands of volunteers. Our mission is to globally foster philanthropic works. By designing innovative and inspiring programs, our goal is to engage students and professionals to work together to educate, empower and lift the underprivileged. One of our endeavors is to provide free education, educational materials and support. We have established libraries and a printing press for original publications. Our motto is to teach with compassion where a good human being is developed rather than a typical human who is only professionally equipped. Starting from volunteers, their children, refugees, street children and orphans, anyone with an underprivileged background is welcome at our door. One of the highly successful projects that we carried out is the Ak-Taka-Ahar (One-taka-meal) program. Here we let people come in and purchase a meal for only 1 taka/0.012 USD. This guarantees entitlement to food while feeling self-reliance by purchasing with a minimum cost and at the same time having a decent, healthy meal with dignity. Under this program, we also provide food for people under the age of 12 and over 60 years old people. This successful venture has inspired us to launch One-Taka-Bazaar where any item sold is just 1 taka/ 0.012 USD and 1 taka Chikistsha ( One-taka-treatment). Anyone who has a need can come to get service just by paying 1 taka and we supplement the rest by crowdfunding.",
                charity_img: "https://upload.wikimedia.org/wikipedia/en/2/23/Bidiyanondo_Foudition_logo.svg",
                charity_contact: "+88-09610-001089",
                charity_email: "assunnahfoundationbd@gmail.com",
                charity_campaigns: ['এক টাকায় আহার - 1 Taka Meal', 'সম্বল - Sombol', 'বিদ্যানন্দ অনাথালয়']

            },
            {
                _id: '3',
                title: "Action Aid bangladesh",
                charity_desc: "ActionAid Bangladesh is working to combat against gender-based violence awareness about women sexual reproductive health rights. Women’s empowerment is key to the social, cultural and economic freedom of all citizens. Our engagement focuses on empowering women to fight for their rights. We will advocate for implementation of feminist policies to combat the injustice and inequality created by visible and invisible power structures in society.",
                charity_img: "https://new-media.dhakatribune.com/en/uploads/2021/10/23/actionaid.jpeg",
                charity_contact: "+88-09610-001089",
                charity_email: "assunnahfoundationbd@gmail.com",
                charity_campaigns: ['EMPOWERING SPORTS WOMEN: A CELEBRATION OF FIFA WORLD CUP 2018', 'SHORT FILM MAKING COMPETITION ON UNPAID CARE WORK', 'SAFE CITY']

            }
        ]




        app.get('/charity', (req, res) => {
            res.send(charities);
        })


        app.get('/charity/:id', (req, res) => {
            const id = req.params.id;
            const charity = charities.find(charity => charity._id === id);
            res.send(charity);
        })



        //Audit trail ==================

        app.post('/donationAuditTrail', async (req, res) => {
            const auditInfo = req.body;
            const result = await donationAuditCollection.insertOne(auditInfo);
            res.send(result);
        })

        app.get('/donationAuditTrail', async (req, res) => {
            // const id = req.params.id;
            const query = {}
            const result = await donationAuditCollection.find(query).toArray();
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