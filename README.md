# Express-REST-API-Skeleton

## Usage
1. Clone the repository with git clone command.
2. Copy ```.env.example``` file to ```.env```.
3. Run the ```npm i``` command if environment is ```local```.
   In ```production``` run command ```npm i --production```
4. Run ```npm i -g nodemon``` to install nodemon globally.
5. Then run ```npm run start:dev``` to run the project locally with nodemon
6. Check API documentation on ```http://localhost:3000/api-docs```
   
## Key Points
1. Swagger Documentation present for API's.
2. Unit testing of components using ```jest``` framework.
3. Access token generation using ```jsonwebtoken```.
4. For Email nodemailer is implemented.
5. For validation the inout data ```joi``` validator is used.
6. Mongodb is used as database.
7. ```winston``` is used as logger.