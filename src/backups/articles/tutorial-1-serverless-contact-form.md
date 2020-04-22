* Pre requires:
  * AWS account
  * AWS CLI


* Create a Form component using Formik
* Create a Lambda function on AWS.
  * [Lambda, SES and API Gateway](https://aws.amazon.com/blogs/architecture/create-dynamic-contact-forms-for-s3-static-websites-using-aws-lambda-amazon-api-gateway-and-amazon-ses/)
  * Create function from scratch
    * Add the following code snippet
    * Add env variables.
  * Create and trigger your first test. This should return a failed attempt. We need to create a policy to allow sending emails first.
  * Go to Permissions and click on the Role name under Execution role. That should bring up the IAM Management console. Add a new policy AmazonSESFullAccess.
  * Make sure your RECEIVER email address is verified in SES otherwise authorise the email address of the receiver.
  * Test your Lamda again. It should successfully send the email to your Receiver address.
* Final step is to create the API Gateway that we will use to POST our form.
  * Click create new API, choose the option to build a REST API.
  * You should now see the Resources console. Go ahead and create a new Resource. Name 
  * On the "contact-form" resource, click Actions and Create a new Method set it to POST
  * Setup the POST method
    * Integration type: Select Lambda Funtion.
    * Lambda Function: ${stageVariables.lbfunc}. This will allow you to deploy different environments for different lambda function. For example, you can have a development and a production api endpoints that will hit the relevant lambda function.
    * Add this point you will be asked to add permissions to your lambda in order to use the enviroment variable approach. You can do that from the AWS CLI: 
    * Replace ${stageVariables.lbfunc} with your lamda function name.
      ```
      aws lambda add-permission   --function-name "arn:aws:lambda:eu-west-1:803095931688:function:tutorial-1-serverless-contact-form"   --source-arn "arn:aws:execute-api:eu-west-1:803095931688:0nv4il751d/*/POST/contact-form"   --principal apigateway.amazonaws.com   --statement-id 2bf8afea-3c2c-479c-a333-ded5b05b0123   --action lambda:InvokeFunction
      ```
      You should get back osmething like:
      ```
      {
          "Statement": "{\"Sid\":\"2bf8afea-3c2c-479c-a333-ded5b05b0123\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"apigateway.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:eu-west-1:803095931688:function:tutorial-1-serverless-contact-form\",\"Condition\":{\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:execute-api:eu-west-1:803095931688:0nv4il751d/*/POST/contact-form\"}}}"
      }
      ```

      And this will be added in your Lambdas permissions: Resource-based policy:
      {
        "Version": "2012-10-17",
        "Id": "default",
        "Statement": [
          {
            "Sid": "2bf8afea-3c2c-479c-a333-ded5b05b0123",
            "Effect": "Allow",
            "Principal": {
              "Service": "apigateway.amazonaws.com"
            },
            "Action": "lambda:InvokeFunction",
            "Resource": "arn:aws:lambda:eu-west-1:803095931688:function:tutorial-1-serverless-contact-form",
            "Condition": {
              "ArnLike": {
                "AWS:SourceArn": "arn:aws:execute-api:eu-west-1:803095931688:0nv4il751d/*/POST/contact-form"
              }
            }
          }
        ]
      }
    * Now to deploy the API, from action select Reploy API, select new stage. Name your stage dev as in development. Note: you can deploy your API multiple times and create different environments e.g: prod that will explained later on how to point to a different Lambda Function
    * Copy and paste the API URL: https://0nv4il751d.execute-api.eu-west-1.amazonaws.com/prod/contact-form in your request.