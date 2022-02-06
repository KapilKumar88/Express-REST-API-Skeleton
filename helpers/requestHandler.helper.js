const sendResponse = (res, status = false, statusCode = 200, statusMessage = 'Ok', data = null) => {
    let resSchema = {
        status,
        statusCode,
        statusMessage,
    }

    if(data != null){
        resSchema.data = data;
    }

    return res.status(statusCode).json(resSchema);
}


module.exports = {
    sendResponse
}