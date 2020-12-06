const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const request = require('request');
const app = express()
// Add your own API KEY 
const apiKey = '';



app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

//=======
//Auth
//=======
const cookieExpire = 1000 * 60 * 60 * 24
const users = [
  {id: 1, name:'Tester',email:'test@test.com', password:'secret'}
]
const {
  PORT = 3000,
  NODE_NEW = 'development',
  SESSION_NAME = 'sid',
  SESSION_TIME = cookieExpire,
  SESSION_SECRET = 'shhh we got a secret/string/going\on'

}=process.env
const IN_PROD = NODE_NEW === 'production'; // will be false for users

app.use(session ({
 name: SESSION_NAME,
 resave:false,
 saveUninitialized:false,
 secret:SESSION_SECRET,
  cookie:{
      maxAge: SESSION_TIME,
      sameSite: true,
      secure: IN_PROD,
  }
}));
const redirectUser=(req,res,next)=>{
  if(!req.session.userId){
      res.redirect('/login') // redirect to login
  }
  else{
      next();
      //redirect('/')?
  }
}
const redirectToHome=(req,res,next)=>{
  if(req.session.userId){
      res.redirect('/weather') // 
  }
  else{
      next();
  }
}
// main page
app.get('/', (req,res)=> {
  const {userId}=req.session
  res.send(`
  <h1>Welcome</h1>
  ${userId ? `
  <a href='/home'> Home </a>
  <form method='post'  action='/logout'>
  <button>Logout</button>
  </form> `:`
  <a href='/login'>Login</a>
  <a href='/register'>Register</a>
  `}
  `)
});
app.get('/home', redirectUser,(req,res,next)=> {
  const user = users.find( user => user.id === req.session.userId)
  if(user){
    res.redirect('/weather');
  }
  else{res.redirect('/login');}
});
app.get('/login', redirectToHome,(req,res)=> {
 res.send(
  `
  <h1>Login</h1>
  <form method='post' action='/login'>
  <input type ='email' name='email' placeholder='Email' required />
  <input type ='password' name='password' placeholder='Password' required />
  <input type ='submit'/>
  </form>
  <a href='/register' />
  `

 )
});
app.get('/register',redirectToHome, (req,res)=> {
  res.send(
      `
      <h1>Register</h1>
      <form method='post' action='/register'>
      <input type ='name' name='name' placeholder='Name' required />
      <input type ='email' name='email' placeholder='Email' required />
      <input type ='password' name='password' placeholder='Password' required />
      <input type ='submit'/>
      </form>
      <a href='/login' />
      `
     )
});
app.post('/login', redirectToHome,(req,res)=> {
  const {email, password} = req.body;
  if(email && password){
      const user = users.find(user => user.email === email && user.password === password)
      if(user){
          req.session.userId = user.id;

         //var thing2 = location= "/views/index.html";;
      }
  }
  res.redirect('/login');
});
app.post('/register',redirectToHome, (req,res)=> {
  const {name,email, password} = req.body;
  if(name&&email&&password){
      const exists = users.some(
          user => user.email === email
      )
      if(!exists){
          const user = {
              id: users.length+1,
              name,
              email,
              password
          }
          users.push(user);
          req.session.userId = user.id
          return res.redirect('/home');
      }
  }
  res.redirect('/register');
});
app.post('/logout',redirectUser, (req,res)=> {
  req.session.destroy(err=> {
      if(err){
          return res.redirect('/home');
      }
      res.clearCookie(SESSION_NAME);
      res.redirect('/login');
  });
});

//Weather

app.get('/weather', function (req, res) {
  const user = users.find( user => user.id === req.session.userId)
  if(user){
    res.render('index', {weather: null,humidity: null, wind: null, coord: null, error: null})
  }
  else{res.redirect('/login');}
})

app.post('/weather', redirectUser, function (req, res) {
  const user = users.find( user => user.id === req.session.userId)
  if(user){
      let city = req.body.city;
      let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

      request(url, function (err, response, body) {
        if(err){
          res.render('index', {weather: null, humidity: null, wind: null, coord: null,  error: 'Error, please try again'});
        } else {
          let weather = JSON.parse(body)
          console.log(weather);
          if(weather.main == undefined){
            res.render('index', {weather: null, humidity: null, error: 'Error, please try again'});
          } else {
            let weatherText = `It's ${weather.main.temp} degrees in ${weather.name} in ${weather.sys.country} !`;
            let humidityText = `The level of humidity is ${weather.main.humidity}.`;
            let windText =`The current wind reading is ${weather.wind.speed}`;
            let coordText =`The coordinates of the the city our ${weather.coord.lon} longitude ~ ${weather.coord.lat} latitude`;
            res.render('index', {weather: weatherText , humidity: humidityText, wind: windText, coord: coordText, error: null});
          }
        }
      });

    }
    else{res.redirect('/login');}
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
