const jwt = require("jsonwebtoken");

exports.authUserToken = (req, res, next) => {
  const token = req.headers["x-user-token"] || req.cookies.userToken;
  if (!token) {
    return res.status(401).json({ message: "No Token Provided" });
  }

  const decoded = jwt.verify(token, process.env.JWT_USER_TOKEN);

  if (!decoded) {
    return res.status(403).json({ message: "Invalid Token" });
  }

  req.userId = decoded.userId;
  next();
};
