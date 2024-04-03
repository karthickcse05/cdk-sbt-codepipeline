# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npx cdk bootstrap --profile karthick` 
* `npx cdk deploy --profile karthick --require-approval never`
* `npx cdk deploy S3Stack --profile karthick --require-approval never`
* `npx cdk destroy`

* `aws ec2 describe-instance-type-offerings --location-type "availability-zone" --filters Name=location,Values=us-east-1f --region us-east-1 --profile test --query "InstanceTypeOfferings[*].[InstanceType]" --output text | sort`
