import dbConnect from "@/lib/dbConnect";
import UserModel from "@/Model/User";
import {z} from 'zod'
import { verifySchema } from "@/Schemas/VerifySchema";

export async function POST(request:Request) {
    await dbConnect()

// checking the  username from zod
// TODO 
  const CheckVerifyCodeShema = z.object({
    verifyCode: verifySchema
  })

    try {
      // taking username and code 
       const {username , code}  = await request.json() 
      
      //  const parsed = CheckVerifyCodeShema.safeParse(code)
      //  if (!parsed.success) {
      //   return Response.json({
      //     success: false,
      //     messaage: "Invaild Input must be a 6 digit code"
      //   } , {status: 400})  
      //  }
      
       // If the username came URL-encoded, this turns it back to a normal string (e.g., john%20doe → john doe)
      const decodedUsername =  decodeURIComponent(username) 
      // finding the user in database ? 
       const user = await UserModel.findOne({username: decodedUsername})

         if (!user) {
             return Response.json({
        success: false,
        message: "User not Found"
       } , {status: 500})
         }

       // checks if the code is not expired
      const isCodeVaild = user.verifyCode === code // true or false
      // comparing the dates 
      const IsCodeExpried = new Date(user.verifyCodeExpiry) > new Date()
      
      if (isCodeVaild && IsCodeExpried) {
        user.isVerified = true
        await user.save()

      return Response.json({
        success: true,
        message: "Account verified sucessfully"
       } , {status: 201})
      }
      // if code is expired
     else if(!IsCodeExpried) {
         return Response.json({
        success: false,
        message: "verification is expired please sign up again to gett a new code"
       } , {status: 400})

     } else {
    // if the OTP is wrong
    return Response.json({
        success: false,
        message: "Incorrect Verification code"
       } , {status: 400})

     }


    } catch (error) {
        console.error("Error while verifying the code" , error)
       return Response.json({
        success: false,
        message: "Error while checking the code"
       } , {status: 500})
    }
}