const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      role,
      hotelName,
      propertyLocation,
      businessLicense,
      taxInformation,
      numberOfUnits,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Build user data object
    const userData = {
      name,
      email,
      password,
      phone: phone || "",
      address: address || "",
      role: role || "user",
      isApproved: role === "hotel_admin" ? false : true,
    };

    // Add hotel partner fields if present
    if (hotelName) userData.hotelName = hotelName;
    if (propertyLocation) userData.propertyLocation = propertyLocation;
    if (businessLicense) userData.businessLicense = businessLicense;
    if (taxInformation) userData.taxInformation = taxInformation;
    if (numberOfUnits) userData.numberOfUnits = numberOfUnits;

    // Handle validId file upload
    if (req.file) {
      userData.validId = `/uploads/valid-ids/${req.file.filename}`;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message:
        user.role === "hotel_admin"
          ? "Account created. Waiting for system admin approval."
          : "Registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // ❗ BLOCK UNAPPROVED HOTEL ADMIN
    if (user.role === "hotel_admin" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        error:
          "Your account is waiting for approval by system admin. Please check your email for updates.",
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= GET ME =================
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
};

exports.approveHotelAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "hotel_admin") {
      return res
        .status(404)
        .json({ success: false, error: "Hotel admin not found" });
    }

    if (user.isApproved) {
      return res
        .status(400)
        .json({ success: false, error: "User is already approved" });
    }

    // Generate temporary password
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);

    // Update user
    user.isApproved = true;
    user.password = tempPassword;
    await user.save();

    // ✅ Send email in BACKGROUND - does not block the response
    const sendEmail = require("../utils/sendEmail");
    sendEmail({
      to: user.email,
      subject: "Your AI STAY Partner Account Has Been Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Welcome to AI STAY, ${user.name}!</h2>
          <p>Your hotel partner application has been <strong>approved</strong> by our system administrator.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Your Login Credentials:</strong></p>
            <p>Email: ${user.email}</p>
            <p>Temporary Password: <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          <p>Please login and change your password immediately.</p>
        </div>
      `,
    }).catch((emailErr) => {
      console.log("Email failed:", emailErr.message); // Logs but doesn't block
    });

    // ✅ Respond immediately without waiting for email
    res.json({
      success: true,
      message: "Hotel admin approved successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
        tempPassword: tempPassword,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= GET PENDING HOTEL ADMINS =================
exports.getPendingHotelAdmins = async (req, res) => {
  try {
    const users = await User.find({
      role: "hotel_admin",
      isApproved: false,
    }).select("-password");

    // Format the response to include hotel info
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hotelName: user.hotelName || "N/A",
      propertyLocation: user.propertyLocation || "",
      businessLicense: user.businessLicense || "",
      taxInformation: user.taxInformation || "",
      numberOfUnits: user.numberOfUnits || "",
      validId: user.validId || "",
      role: user.role,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
    }));

    res.json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// ================= UPDATE USER (System Admin Only) =================
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isApproved } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, isApproved },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= DELETE USER (System Admin Only) =================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await user.deleteOne();

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= GET ALL USERS (System Admin Only) =================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= REGISTER HOTEL ADMIN (BY SYSTEM ADMIN) =================
exports.registerHotelAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, hotelId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      role: "hotel_admin",
      isApproved: true, // Auto-approved since system admin created it
      hotelId: hotelId || null,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Hotel admin account created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
// Temporary: Create system admin
exports.createSystemAdmin = async (req, res) => {
  const user = await User.create({
    name: "System Admin",
    email: "adminsystem@aistay.com",
    password: "admin123",
    role: "system_admin",
    isApproved: true,
  });
  res.json({ success: true, message: "System admin created" });
};
