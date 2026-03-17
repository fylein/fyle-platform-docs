# Errors
Sage Expense Management uses conventional HTTP response codes to indicate the success or failure of an API request. 
In general: 
*   Codes in the 2xx range indicate success. 
*   Codes in the 4xx range indicate an error that failed given the information provided (e.g., a required parameter is missing, improper usage of parameters etc.). 
*   Codes in the 5xx range indicate an error with Sage Exp Mgmt's servers(these are rare). 

> Please contact us at support@fylehq.com if a 5xx error is encountered. 

## Types Of Errors
| SL NO.  |  HTTP STATUS CODE  | HTTP MESSAGE | ENGLISH EXPALINATION |
|---------|--------------------|--------------|--------------------- |
|    1.   |         400       |   Bad Request |  The request data or query sent is malformed |
|    2.   |         401      |  Unauthorized |  The credentials are not valid |
|    3.   |          403      |     Forbidden |  The API token doesn't have permissions to perform the requested action|
|    4.   |          404    |      Not Found| The requested resource doesn’t exist|


## Different Reasons for 400 errors 

1. **ValidationError:** 
    This type of error occurs when either a mandatory parameter is missing or when the parameters are not formatted as defined ( E.g., Passing an integer for a string, Not following the pattern required for phone numbers etc.)
    <!--focus: false-->
      ``` json
    {
    "data": {
        "0": {
            "user_email": [
                "Missing data for required field."
            ]
        }
    },
    "error": "ValidationError",
    "message": null
    }
    ```
    <!--focus: false-->
   | <b> Example of ValidationError. Required parameter user_email is missing </b>

2. **BulkError:**
    This type of error occurs during bulk operations when an entity is not found ( E.g., Passing the name of the department which does not exist etc.)
    <!--focus: false-->
     ```json
    {
    "data": [
        {
            "key": "new.cbdkbcdhkbcdjkcbd@fyle.in",
            "message": "Invalid / disabled department found",
            "row": 0
        }
    ],
    "error": "BulkError",
    "message": null
    }
     ```
    <!--focus: false-->
    | <b>Example of BulkError. Invalid Department name</b>
3. **IntegrityError**
    The Integrity Error occurs for two reasons
    
    1. The data that is being created already exists
    <!--focus: false-->
    ```json
   {
    "data": null,
    "error": "IntegrityError",
    "message": "The values (\"fast and furious\", \"formula one\", \"oriSOntNdZGd\") already exists"
    }
     ```
    <!--focus: false-->
    | <b>Example of IntegrityError. Data already Exists</b>
    
    2. The data that in the request object is not mapped in our databases
     <!--focus: false-->
    ```json
    {
    "data": [
        {
            "key": "new.cbdkbcdhkbcdjkcbd@fyle.in",
            "message": "Invalid / disabled department found",
            "row": 0
        }
    ],
    "error": "BulkError",
    "message": null
    }
     ```
    <!--focus: false-->
    | <b>Example of IntegrityError. Data already Exists</b>

> A 400 error is generally encountered due to inaccuracies in the request data. We request to rectify the data using the hints provided in the error messages before re-sending API requests.  

## Attributes Of Error Response:

All the types of error have three attributes:
1. data 
2. error 
3. message

**Data Attribute:**
    The <u>data</u> attribute will consist of information about errors in the parameter sent. 
1. When a *ValidationError* is encountered, the response data attribute will consist of the information about which key is causing the error and for what reason. 

    Examples:
    <!--focus: false-->
    1. Example of missing param 
        ```json
        {
        "data": {
            "0": {
                "user_email": [
                    "Missing data for required field."
                ]
            }
        },
        "error": "ValidationError",
        "message": null
        }
        ```
        <!--focus: false--> 
    2. Example of malformed param
        ```json
        {
        "data": {
            "0": {
                "mobile": [
                    "String does not match expected pattern."
                ]
            }
        },
        "error": "ValidationError",
        "message": null
        }
        ```

2. When a *BulkError* is encountered, the response data is an array of objects which consists of the following keys: 
    1. *key* refers to the value that uniquely identifies the object from the array of objects that is passed as a parameter.
    2. *message* gives reason for the failure of the message
    3. *row* indicates the index of the object in the data array that is passed by the user.
    
    Example:
    ```json
    {
    "data": [
        {
            "key": "new.cbdkbcdhkbcdjkcbd@fyle.in",
            "message": "Invalid / disabled department found",
            "row": 0
        }
    ],
    "error": "BulkError",
    "message": null
    }
     ```
**Error Attribute:**
    The <u>error</u> attribute will specify the type of error that has occurred. 
**message**
    The <u>message</u> attribute will have a human-readable explanation of why the request is failing. 