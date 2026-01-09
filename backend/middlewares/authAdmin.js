import jwt from 'jsonwebtoken'

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Not Authorized' });

    const token = authHeader.split(' ')[1];
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    if (token_decode.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Not Authorized' });
    }

    req.adminId = token_decode.id;
    next();
  } catch (error) {
    console.log('AuthAdmin error:', error);
    return res.status(401).json({ success: false, message: 'Invalid Token or Not Authorized' });
  }
};


export default authAdmin
