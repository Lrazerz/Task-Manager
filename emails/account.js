const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

// subject === leave for leave, any other for join
module.exports = async (email, name, subject) => {
  const joinSubject = 'Thanks for joining in!';
  const leaveSubject = 'Good bye...';
  const joinMessage = `Welcome to the app, ${name}. Let me know how you get along with the app.`;
  const leaveMessage = `Thanks for using our services, ${name}. Good bye.`;

  const msg = {
    to: email,
    from: 'igorivanov192312@gmail.com',
    subject: subject === 'leave' ? leaveSubject : joinSubject,
    text: subject === 'leave' ? leaveMessage : joinMessage
  }

  try {
    await sgMail.send(msg);
    console.log('mail sended');
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
  }
};