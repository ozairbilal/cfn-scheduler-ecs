#!/bin/bash


while getopts a:e:s:r: OPTION
  do
    case "${OPTION}"
      in
        a) AWS_PROFILE=${OPTARG};;
        s) STACK_NAME=${OPTARG};;
        r) REGION=${OPTARG};;
    esac
done

if [ -z "${AWS_PROFILE}" ]
  then
    echo "Syntax Error:"
    echo "./before_deploy.sh -a aws_profile -s STACK_NAME"
    echo
    exit 1
fi

DIR=$(realpath "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../../");

BUCKET_NAME=$(aws --profile=${AWS_PROFILE} cloudformation describe-stacks --stack-name s3 | jq -r '.Stacks[].Outputs[]|select(.OutputKey=="CFS3Bucket")|.OutputValue')
S3_PATH="s3://${BUCKET_NAME}/${varS3KeyCode}"
ZIPFILE="${varS3KeyCode}"
IMAGE="${ZIPFILE}-"$(date +%s )
CODE_PATH="${DIR}/.tmp/${ZIPFILE}"

echo
echo
echo "Deploying to ${S3_PATH}"
echo "Press <ENTER> to continue ..."
echo
read

docker build --build-arg ZIPFILE=${ZIPFILE} -t ${IMAGE} -f ${DIR}/common/utilities/cron-scheduler/Dockerfile ${DIR}/common/utilities/cron-scheduler
CONTAINER_ID=$(docker create ${IMAGE} /bin/bash)
docker cp ${CONTAINER_ID}:/${ZIPFILE} ${CODE_PATH}
docker rm -f ${CONTAINER_ID}

aws --profile=${AWS_PROFILE} s3 cp ${CODE_PATH} ${S3_PATH}


echo
echo
echo "Before deploy hook finished, proceeding to the stack."
