import json
import boto3

def lambda_handler(event, context):
    # TODO implement
    if "detail" in event:
        build_id = event["detail"]["build-id"].split("/")[1]
        detail_type = event["detail-type"]
        project_name = event["detail"]["project-name"]
        region = event["region"]
        account_id = event["account"]
        cloudwatch_link = event["detail"]["additional-information"]["logs"]["deep-link"]
        mail_subject= project_name + ' ' + detail_type
        build_status = event["detail"]["build-status"]
        codebuild_url = f"https://{region}.console.aws.amazon.com/codesuite/codebuild/{account_id}/projects/{project_name}/build/{build_id}"
        mail_message = (
                        f"{project_name} code build status is {build_status}\n"
                        "\n"
                        f"Kindly visit the below link to view more details on this build.\n"
                        f"{codebuild_url}"
                        "\n"
                        "\n"
                        f"Kindly visit the below link to view the logs of this build in cloudwatch.\n"
                        f"{cloudwatch_link}"
                        "\n"
                        )
    else:
        s3_event = event["Records"][0]["eventName"]
        s3_source = event["Records"][0]["eventSource"]
        s3_time = event["Records"][0]["eventTime"]
        s3_object = event["Records"][0]["s3"]["object"]["key"]
        s3_bucket = event["Records"][0]["s3"]["bucket"]["name"]
        mail_subject= s3_bucket + ' has been updated !!!'
        if(s3_event == "ObjectCreated:Put" and s3_source == "aws:s3" and "kitchen.png" in s3_object):
            mail_message = (
                        f"A new version of {s3_object} has been uploaded in {s3_bucket} at {s3_time}\n"
                        )
            print(mail_message)
    client = boto3.client('sns')
    client.publish(Message=mail_message,
                Subject=mail_subject,
                TopicArn='')
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
