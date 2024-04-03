import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as emr from 'aws-cdk-lib/aws-emr';
import * as iam from "aws-cdk-lib/aws-iam";

export class EMRStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      
    // emr service role
    const emr_service_role  = new iam.Role(this, "emr_service_role ", {
        assumedBy: new iam.ServicePrincipal("elasticmapreduce.amazonaws.com"),
        roleName:this.node.tryGetContext("emr_service_role_name"),
        managedPolicies:[
            iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonElasticMapReduceRole")
        ],
    });

    emr_service_role.addToPolicy(new iam.PolicyStatement({
        effect:iam.Effect.ALLOW,
        actions:["*"],
        resources:["*"]
    }))

    // emr job flow role
    const emr_job_flow_role   = new iam.Role(this, "emr_job_flow_role", {
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        roleName:this.node.tryGetContext("emr_job_flow_role_name"),
        managedPolicies:[
            iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonElasticMapReduceforEC2Role")
        ],
    });

    const emr_job_flow_profile = new iam.InstanceProfile(this,"emr_job_flow_profile",{
        role:emr_job_flow_role,
        instanceProfileName:this.node.tryGetContext("instance_profile_name"),
    })

    const cfnCluster = new emr.CfnCluster(this, 'MyCfnCluster', {
        instances: {
            masterInstanceGroup: {
                instanceCount: 1,
                instanceType: this.node.tryGetContext("master_instance_type"),
                market: 'ON_DEMAND',
                name: 'master-instance',
            },
            coreInstanceGroup: {
                instanceCount: 2,
                instanceType: this.node.tryGetContext("slave_instance_type"),
                market: 'ON_DEMAND',
                name: 'core-instance',
            },
            ec2KeyName: this.node.tryGetContext("ec2KeyPairName"),
            ec2SubnetId: this.node.tryGetContext("ec2SubnetId"),  
            placement:{
                availabilityZone:this.node.tryGetContext("availability_zone")
            }  
        },
        jobFlowRole: emr_job_flow_profile.instanceProfileName,
        name: this.node.tryGetContext("emr-cluster-name"),
        serviceRole: emr_service_role.roleName,
        ebsRootVolumeSize: 15,
        logUri: "s3://"+this.node.tryGetContext("logbucketName")+"/emr-logs",
        releaseLabel: this.node.tryGetContext("emr-release-label"),
        visibleToAllUsers: true,
        tags: [{
            key: 'owner',
            value: 'test',
        }],
    });
    }
}