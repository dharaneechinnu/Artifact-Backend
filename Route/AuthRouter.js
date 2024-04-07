require('dotenv').config();
const express = require('express');
const router = express.Router();
const usermodel = require('../Model/User' );
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PASS = process.env.PASS;
const nodemailer = require('nodemailer');


function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


router.post('/reg', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Enter all the fields" });
        }

        const user = await usermodel.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
       

        const hashpwd = await bcrypt.hash(password, 10);

        await usermodel.create({ name, password: hashpwd, email });

        res.status(200).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/*gen-otp */

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/reg/generate', async (req, res) => {
    try {
        const { email } = req.body;

        const user =  usermodel

        const otp = generateOTP();

        user.otpToken = otp;
        user.Otpexprie = Date.now() + 3600000;
        

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "dharaneedharanchinnusamy@gmail.com",
                pass: PASS
            }
        });

        const mailOptions = {
            from: "dharaneedharanchinnusamy@gmail.com",
            to: email,
            subject: "Email Verification OTP",
            html: `
              <div style=  color: black ; font-size: 20px;">
                <p>Hello,</p>
                <p><strong>Your OTP for email verification is: <span style="color: black;">
                \<h1>${otp}</h1>\n</span></strong></p>
                <p>Please use this OTP to verify your email.</p>
                <p>Best regards,<br/>Your App Team</p>
              </div>
            `
          };
          

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending verification OTP email:", error);
                return res.status(500).json({ message: "Failed to send verification OTP email" });
            }
            console.log("Verification OTP email sent:", info.response);
            res.status(200).json({ message: "Verification OTP sent to email" });
        });

    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/reg/verify-otp', async (req, res) => {
    try {
        const {  otp } = req.body;
        const user =  usermodel
       
         if (user.otpToken !== otp) { 
            return res.status(400).json({ message: "Invalid OTP" });
        }

        else if (user.Otpexprie < Date.now()) { 
            return res.status(400).json({ message: "OTP has expired" });
        }

       else if(user.otpToken === otp)
       {
        await usermodel.findByIdAndUpdate(user._id,{Verified:true})
        

        user.otpToken = null;
        user.Otpexprie = null;



        res.status(200).json({ message: "Email verified successfully" });
       }
       else{
        res.status(400)
       }
       
    } catch (error) {
        console.error("Error verifying email OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



router.route('/login').post(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        const user = await usermodel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const accessToken = jwt.sign(
                { email: email, userId: user._id, role: user.role },
                process.env.ACCESS_TOKEN,
                { expiresIn: '1d' }
            );

            res.status(200).json({Email:email, accessToken, userId: user._id, Name: user.name, role: user.role }); // Include user's name in the response
        } else {
            res.status(401).json({ error: "Invalid password" });
        }

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



router.post("/res", async (req, res) => {
    const { email } = req.body;
    try {
       
        const user = await usermodel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

     
        const token = generateOTP();


      
        user.resetPwdToken = token;
        user.resetPwdExpire = Date.now() + 3600000; 

      
        await user.save();

       
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "dharaneedharanchinnusamy@gmail.com",
                pass: PASS
            }
        });

        const mailOptions = {
            from: "dharaneedharanchinnusamy@gmail.com", 
            to: user.email,
            subject: "Password Reset Request",
            text: `Hello ${user.name},\n\nYou requested to reset your password. Please use the following token to reset your password:\n\n${token}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nYour App Team`
        };

  
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending password reset email:", error);
                return res.status(500).json({ message: "Failed to send password reset email" });
            }
          
            console.log("Password reset email sent:", info.response);
            res.status(200).json({ message: "Password reset email sent" });
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/respwd", async (req, res) => {
    const { token } = req.body;
    const { pwd } = req.body;
    try {
      
        const user = await usermodel.findOne({
            resetPwdToken: token,
            resetPwdExpire: { $gt: Date.now() } 
        });
        if (!user) {
            return res.status(404).json({ message: "Invalid or expired token" });
        }

      
        const hashedPassword = await bcrypt.hash(pwd, 10);

    
        user.password = hashedPassword;
        user.resetPwdToken = null;
        user.resetPwdExpire = null;

      
        await user.save();
         console.log("Succesfully")
      
        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


/*verify*/





module.exports = router;