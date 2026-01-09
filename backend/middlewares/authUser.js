import jwt from 'jsonwebtoken'

const authUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not Authorized'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.id   // 👈 THIS is what we will use
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Token'
    })
  }
}

export default authUser
