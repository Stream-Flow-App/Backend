const express = require('express');
const { sendContactEmail } = require('../controllers/contact.Controller');

const router = express.Router();

router.post('/', sendContactEmail);

module.exports = router;
