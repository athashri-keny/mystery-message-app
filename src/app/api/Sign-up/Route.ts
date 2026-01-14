import dbConnect from "@/lib/dbConnect";
import UserModel from "@/Model/User";
import bcrypt from 'bcrypt'
import { sendVerificationEmail } from "@/Helpers/SendVerificationEmail";



export async function POST(request: Request) {
    await dbConnect() /// trying to dbconnect 

    try {

       const {username , email , password} = await request.json() // taking the inputs from user
      
       // checking if the username is taken or not  
      const existingUserVerifedByUsername = await UserModel.findOne({
        username,
        isVerified: true,
       }) 
        
      // if the username has already taken then send this 
       if (existingUserVerifedByUsername) {
        return Response.json({
       success: false,
       message: "User name is already Taken "
        } , {status: 400})
       }
    
       // find the user by email // checking if the email already exists 
     const ExistingUserByemail =  await UserModel.findOne({email})
     // creating a random 6 digit code
const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();


     //  If Email Exists: Update Their Info
     if (ExistingUserByemail) {
        if (ExistingUserByemail.isVerified) {
            return Response.json({
        success: false,
        message: "User already Exist with this email"
        } , {status: 400})

        } else {
            const hasedPassword = await bcrypt.hash(password , 10)
            ExistingUserByemail.password = hasedPassword
            ExistingUserByemail.verifyCode = verifyCode
            ExistingUserByemail.verifyCodeExpiry = new Date(Date.now() + 3600000)
            await ExistingUserByemail.save()
        }
      
        // if existingUserbyEmail is not here means the user has come first time
     } else {
    
        // adding extra security for the password
        const hashPassowrd = await bcrypt.hash(password , 10)
        // setting expiry date of the Verify Code (OTP)
        const expiryDate = new Date() 
        expiryDate.setHours(expiryDate.getHours() + 1)

        // if the email is new Create a new User
         const newUser = new UserModel({
               username,
               email,
               password: hashPassowrd,
               verifyCode,
               verifyCodeExpiry: expiryDate,
               isVerified: false,
               isAcceptingMessage: true,
               messages: []
        })
        // saving the user in database
        await newUser.save()
     }


     // send verification email
      const emailReponse = await sendVerificationEmail(email , username , verifyCode)

      if (!emailReponse.success) {
        return Response.json({
        success: false,
        message: emailReponse.message
        } , {status: 500})
      }
       return Response.json({
        success: true,
        message: "User register successfully. please verify Your email"
        } , {status: 201})


    } catch (error) {
        console.log("Error register user" , error)
        return Response.json(
            {
                success: false,
                message: "Error while Registering User"
            },
            {
                status: 500
            }
        )
    }
}



// ✅ Summary in Simple Words
// User sends username, email, and password to your backend.

// Your code checks:

// Is the username already taken? ❌ = Stop

// Is the email already used? ❌ = Stop

// If email is used but not verified → update it with new password and OTP.

// If everything is new → create a new user in the database.

// Send OTP to the user’s email.

// Ask them to verify their email before logging in.