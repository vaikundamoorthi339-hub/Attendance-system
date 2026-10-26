import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true   
    }
});

export const User = mongoose.model('User', userSchema);

const attendanceSchema = new mongoose.Schema({
    teacherId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    otp: { 
        type: String, 
        required: true 
    },
    otpExpiry: { 
        type: Date, 
        required: true 
    },
    students: [{
        studentId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        },
        ipAddress: { type: String },
        status: { 
            type: String, 
            enum: ['pending', 'present'], 
            default: 'pending' 
        }
    }]
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);