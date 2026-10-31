import express from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import mongoose from 'mongoose';
import { Attendance, User } from './user.mjs';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
import cors from 'cors';
app.use(cors({
  origin: 'https://attendance-system-coders-bfb3.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("db connected"))
    .catch((err) => console.log("error occured", err));

app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: ({
        secure: false,
        maxAge: 1000 * 60 * 60
    })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    { usernameField: "user_name", passwordField: "password" },
    async (user_name, password, done) => {
        try {
            const user = await User.findOne({ user_name: user_name });
            if (!user) {
                return done(null, false, { msg: "user not found" });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { msg: "incorrect password" });
            }
            return done(null, user);
        }
        catch (err) {
            console.log(err);
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    } catch (err) {
        return done(err);
    }
});

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(400).send("require to login");
};

app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).send({ msg: info ? info.msg : "Invalid credentials" });
        req.logIn(user, (logInerr) => {
            if (logInerr) return next(logInerr);
            return res.status(200).send({
                success: true,
                msg: "login successfully",
                role: user.role,
                name: user.name,
                user_name: user.user_name
            });
        });
    })(req, res, next);
});

app.post("/api/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).send({ msg: "Logout failed" });
        req.session.destroy((err) => {
            if (err) return res.status(500).send({ msg: "Session destroy failed" });
            res.clearCookie("connect.sid"); 
            return res.status(200).send({ success: true, msg: "Logged out successfully" });
        });
    });
});

app.post("/api/signup", async (req, res) => {
    const { name, user_name, password, role, secretKey } = req.body;
    try {
        if (!name || !user_name || !password || !role) {
            return res.status(400).send({ msg: "All fields are required" });
        }

        if (role === "teacher" && secretKey !== process.env.TEACHER_SECRET) {
            return res.status(403).send({ msg: "Access Denied: Invalid Teacher Secret Code" });
        }

        const existuser = await User.findOne({ user_name: user_name });
        if (existuser) {
            return res.status(400).send({ msg: "user Already exist" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            name, 
            user_name, 
            password: hashedPassword, 
            role 
        });
        await newUser.save();
        res.status(200).send({ success: true, msg: "Account created successfully" });
    }
    catch (err) {
        console.log("Signup Error:", err);
        res.status(500).json({ success: false, msg: "server error" });
    }
});

app.post("/api/attendance/generate", isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(400).send({ msg: "Access denied:only teacher can be login" });
        }

        const generatedotp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 5);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayStartId = mongoose.Types.ObjectId.createFromTime(
            Math.floor(startOfDay.getTime() / 1000)
        );

        const existingToday = await Attendance.findOne({ _id: { $gte: todayStartId } });

        if (existingToday) {
            existingToday.otp = generatedotp;
            existingToday.otpExpiry = expiryTime;
            await existingToday.save();

            return res.status(200).send({
                success: true,
                msg: "Today's OTP regenerated",
                otp: generatedotp,
                Attendance_id: existingToday._id,
                expiresAt: expiryTime
            });
        }

        const newAttendance = new Attendance({
            teacherId: req.user._id,
            otp: generatedotp,
            otpExpiry: expiryTime
        });
        await newAttendance.save();

        res.status(200).send({
            success: true,
            msg: "OTP generated Successfully",
            otp: generatedotp,
            Attendance_id: newAttendance._id,
            expiresAt: expiryTime
        });
    }
    catch (err) {
        console.log("Generate Error:", err);
        res.status(500).send({ success: false, msg: "Server error generating OTP" });
    }
});

app.post("/api/attendance/submit", isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(400).send({ msg: "only student can submitted otp" });
        }

        const { otp } = req.body;
        const attendanceRecord = await Attendance.findOne({ otp: otp }).sort({ _id: -1 });

        if (!attendanceRecord) {
            return res.status(400).send({ msg: "Invalid code" });
        }

        const currentTime = new Date();
        if (currentTime > attendanceRecord.otpExpiry) {
            return res.status(400).send({ msg: "Otp expired ask a teacher for new otp" });
        }

        const forwarded = req.headers['x-forwarded-for'];
        const studentIP = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
        
        const COLLEGE_IP = process.env.COLLEGE_IP; 
        const isLocalhost = studentIP === '::1' || studentIP === '127.0.0.1' || studentIP.includes('::ffff:127.0.0.1');
        
        if (!isLocalhost && !studentIP.includes(COLLEGE_IP)) {
            return res.status(403).send({ msg: "Access Denied: Please connect to College Wi-Fi to mark attendance." });
        }

        const Alreadysubmitted = attendanceRecord.students.find(
            (s) => s.studentId.toString() == req.user._id.toString()
        );
        if (Alreadysubmitted) {
            return res.status(400).send({ msg: "you have already submitted attendance for your session" });
        }

        const ipAlreadyused = attendanceRecord.students.find((s) => s.ipAddress == studentIP);
        if (ipAlreadyused) {
            return res.status(403).send({ msg: "this device have been already mark to attendance" });
        }

        attendanceRecord.students.push({
            studentId: req.user._id,
            ipAddress: studentIP,
            status: 'pending'
        });

        await attendanceRecord.save();

        res.status(200).send({
            success: true,
            msg: "Attendance submitted successfully wait for teacher approach"
        });
    }
    catch (err) {
        console.log("Submit Error:", err);
        res.status(500).send({ success: false, msg: "Server error submitting attendance" });
    }
});

app.get("/api/attendance/latest", isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).send({ msg: "Access Denied: only teacher can view this data" });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayStartId = mongoose.Types.ObjectId.createFromTime(
            Math.floor(startOfDay.getTime() / 1000)
        );

        const latestRecord = await Attendance.findOne({ 
            teacherId: req.user._id,
            _id: { $gte: todayStartId } 
        })
        .sort({ _id: -1 })
        .populate('students.studentId', 'user_name name');

        if (!latestRecord) {
            return res.status(200).send({
                success: true,
                otp: null,
                students: []
            });
        }

        return res.status(200).send({
            success: true,
            otp: latestRecord.otp,
            students: latestRecord.students
        });

    } catch (err) {
        console.log("Latest API Error:", err);
        return res.status(500).send({ msg: "Server error fetching latest attendance" });
    }
});

app.post("/api/attendance/approve", isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).send({ msg: "Only teacher can approve" });
        }

        const { studentId } = req.body;
        const record = await Attendance.findOne({ teacherId: req.user._id }).sort({ _id: -1 });

        if (!record) {
            return res.status(404).send({ msg: "No active attendance session found" });
        }

        const studentIndex = record.students.findIndex(
            (s) => s.studentId.toString() === studentId
        );

        if (studentIndex === -1) {
            return res.status(404).send({ msg: "Student not found in this session" });
        }

        const currentStatus = record.students[studentIndex].status;
        
        if (currentStatus === 'present') {
            return res.status(400).send({ msg: "Student is already marked present." });
        }

        record.students[studentIndex].status = 'present';
        await record.save();

        res.status(200).send({ success: true, msg: "Student marked as present!" });

    } catch (err) {
        console.log("Approve Error:", err);
        res.status(500).send({ success: false, msg: "Server error updating status" });
    }
});

app.get("/api/attendance/stats", isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).send({ msg: "Access Denied: Only students can view stats" });
        }

        const studentId = req.user._id;
        const studentName = req.user.name || req.user.user_name;
        const allSessions = await Attendance.find().sort({ _id: 1 });

        let presentCount = 0, absentCount = 0, pendingCount = 0;
        const history = [];
        const byDate = {};
        const statusPriority = { present: 3, pending: 2, absent: 1 };

        allSessions.forEach((session) => {
            const sessionDate = session._id.getTimestamp();
            const dateKey = sessionDate.toDateString();
            const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
            const studentRecord = session.students.find(s => s.studentId.toString() === studentId.toString());
            let dailyStatus = 'absent';
            if (studentRecord) dailyStatus = studentRecord.status;

            if (dailyStatus === 'present') presentCount++;
            else if (dailyStatus === 'pending') pendingCount++;
            else absentCount++;

            history.push({
                date: sessionDate.toISOString(),
                day: dayName,
                fullDate: sessionDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
                time: sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: dailyStatus,
                otp: session.otp
            });

            if (!byDate[dateKey] || statusPriority[dailyStatus] > statusPriority[byDate[dateKey].status]) {
                byDate[dateKey] = { day: dayName, status: dailyStatus };
            }
        });

        const totalSessions = allSessions.length;
        const evaluatedSessions = presentCount + absentCount;
        const percentage = evaluatedSessions === 0 ? 0 : Math.round((presentCount / evaluatedSessions) * 100);

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toDateString();
            const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
            if (byDate[dateKey]) last7Days.push(byDate[dateKey]);
            else last7Days.push({ day: dayShort, status: 'no-session' });
        }

        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].status === 'present') streak++;
            else if (history[i].status === 'pending') continue;
            else break;
        }

        const reversedHistory = [...history].reverse();

        res.status(200).send({
            success: true,
            studentName,
            stats: { present: presentCount, absent: absentCount, pending: pendingCount, total: totalSessions, percentage, streak, week: last7Days, history: reversedHistory }
        });
    } catch (err) {
        console.log("Stats API Error:", err);
        res.status(500).send({ success: false, msg: "Server Error fetching stats" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});