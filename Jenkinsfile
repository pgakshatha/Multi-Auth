pipeline {
    agent any

    environment {
        AWS_REGION = "ap-south-1"
        ECR_REGISTRY = "218014315199.dkr.ecr.ap-south-1.amazonaws.com"
        ECR_REPOSITORY = "multi-auth"

        IMAGE_NAME = "multi-auth"
        IMAGE_TAG = "${BUILD_NUMBER}"

        CONTAINER_NAME = "multi-auth"
        HOST_PORT = "5001"
        APP_PORT = "5000"

        ENV_FILE = "/opt/multi-auth/.env"
    }

    options {
        timestamps()
        ansiColor('xterm')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Prepare Workspace') {
            steps {
                echo "Cleaning Workspace..."
                deleteDir()

                checkout scm

                sh '''
                    echo "===================================="
                    echo "Git Commit:"
                    git log -1 --oneline
                    echo "===================================="
                '''
            }
        }

        stage('Verify Source Code') {
            steps {
                sh '''
                    echo "Checking Health Route..."

                    grep "Multi-Auth Service is Healthy" routes/index.routes.js

                    echo "Health Route Found"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build --no-cache \
                    -t ${IMAGE_NAME}:${IMAGE_TAG} .

                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                sh '''
                    aws ecr get-login-password \
                    --region ${AWS_REGION} | \
                    docker login \
                    --username AWS \
                    --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} \
                    ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

                    docker tag ${IMAGE_NAME}:latest \
                    ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p ${HOST_PORT}:${APP_PORT} \
                        --env-file ${ENV_FILE} \
                        ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 20

                    echo "Container Status"
                    docker ps

                    echo "Checking Application"

                    curl --fail http://localhost:${HOST_PORT}/

                    curl --fail http://localhost:${HOST_PORT}/health

                    echo "Deployment Successful"
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    docker image prune -af || true
                '''
            }
        }
    }

    post {

        success {

            echo "========================================="
            echo "Deployment Successful"
            echo "Build Number : ${BUILD_NUMBER}"
            echo "Image : ${IMAGE_NAME}:${IMAGE_TAG}"
            echo "========================================="

        }

        failure {

            echo "========================================="
            echo "Deployment Failed"
            echo "========================================="

            sh '''
                echo "Container Logs"

                docker logs ${CONTAINER_NAME} || true
            '''
        }

        always {
            cleanWs()
        }
    }
}
