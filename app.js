const express =  require('express')
const helmet = require('helmet')
const morgan = require('morgan')

const orders = require('./routes/orders')
const authentication = require('./routes/auth')
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())

app.use('/api/orders', orders)
app.use('/api/auth', authentication)

if(app.get('env')==='development'){
    app.use(morgan('dev'))
    console.log('====================================');
    console.log("Developmet env: Morgan is running...");
    console.log('====================================');

}



const port = process.env.PORT || 3000; //set the port number to what is assigned by the server otherwise use port 3000
app.listen(port, () => console.log(`Listening on port ${port}`))