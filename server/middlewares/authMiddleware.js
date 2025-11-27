import { clerkClient } from "@clerk/express";

//middleware protect user routes
export const protectUser = async(req, res, next)=>{
    try {
        if (!req.auth) {
            console.log('Authentication required: req.auth is undefined');
            return res.status(401).json({success: false, message: 'Authentication required'})
        }
        const userId = req.auth.userId
        if(!userId){
            console.log('Authentication required: userId is undefined');
            return res.status(401).json({success: false, message: 'Authentication required'})
        }
        next()
    } catch (error) {
        console.error('Authentication failed in protectUser middleware:', error);
        res.status(401).json({success: false, message: error.message || 'Authentication failed'})
    }
}

//middleware protect educator routes
export const protectEducator = async(req, res, next)=>{
    try {
        const userId = req.auth.userId
        const response = await clerkClient.users.getUser(userId)

        if(response.publicMetadata.role !== 'educator'){
         return res.json({success: false, message: 'Unauthorized Access'})
        }

        next()
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}