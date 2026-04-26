export const asyncHandler = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  });
