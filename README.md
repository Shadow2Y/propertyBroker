MERN Based Fullstack app to act as property broker

WORKFLOW AND ASSUMPTIONS:
  MERN stack is utilised
  MongoDB local DB is used as cookie session storage
  NodeCache is used for main storage of data (MongoDB can also be swapped easily)
  Email can be used to send notifications but need a SMTP server which is paid

  LOGIN / REGISTRATION PAGE:
  Features:
    SVG based Captcha
    Responsive one stop UI
    SELLER or BUYER flow can be configured during login
    Sends a request to fetch captchaID then proceeds to verify with that captchaID
    Captcha ID and its corresponding text is stored in NodeCache - captchaData
  
  PROPERTY LIST PAGE:
    SELLER FLOW:
      Features:
        Can see your own properties as well as other properties
        Option to add your own property
        Option to delete your own property
        UserName and Logout buttons

SCREENSHOTS:

![image](https://github.com/Shadow2Y/propertyBroker/assets/90892814/60b3b307-a228-4aa2-8ec7-54a18ff2de51)
![image](https://github.com/Shadow2Y/propertyBroker/assets/90892814/526ca20f-3d6c-495b-bec2-1f7e64f637ef)
