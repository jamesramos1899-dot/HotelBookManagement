const User = require('../Models/User');
const generateToken = require('../Utils/generateToken');

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      message:
        user.role === 'hotel_admin'
          ? 'Account created. Waiting for system admin approval.'
          : 'Registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // ❗ BLOCK UNAPPROVED HOTEL ADMIN
    if (user.role === 'hotel_admin' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        error: 'Your account is waiting for approval by system admin'
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
        token: generateToken(user._id)
      }
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

// ================= APPROVE HOTEL ADMIN =================
exports.approveHotelAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'hotel_admin') {
      return res.status(404).json({ success: false, error: 'Hotel admin not found' });
    }

    user.isApproved = true;
    await user.save();

    res.json({
      success: true,
      message: 'Hotel admin approved successfully'
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= GET PENDING HOTEL ADMINS =================
exports.getPendingHotelAdmins = async (req, res) => {
  const users = await User.find({
    role: 'hotel_admin',
    isApproved: false
  });

  res.json({ success: true, data: users });
};