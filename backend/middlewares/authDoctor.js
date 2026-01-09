import jwt from 'jsonwebtoken'

const authDoctor = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not Authorized'
      })
    }

    const dtoken = authHeader.split(' ')[1]

    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)

    req.docId = decoded.id   // 👈 THIS is what we will use
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Token'
    })
  }
}

export default authDoctor
