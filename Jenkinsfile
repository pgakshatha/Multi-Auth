pipeline {
    agent any

    environment {
        AWS_REGION      = "ap-south-1"
        ECR_REGISTRY    = "218014315199.dkr.ecr.ap-south-1.amazonaws.com"
        ECR_REPOSITORY  = "multi-auth"

        IMAGE_NAME      = "multi-auth"
        IMAGE_TAG       = "${BUILD_NUMBER}"

        CONTAINER_NAME  = "multi-auth"
        HOST_PORT       = "5001"
        APP_PORT        = "5000"

        ENV_FILE        = "/opt/multi-auth/.env"
    }

    options {
        timestamps()
        buildDiscarder(logRotator(
            numToKeepStr: '10',
            artifactNumToKeepStr: '5'
        ))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    echo "========================================"
                    echo "Git Commit"
                    git log -1 --oneline
                    echo "========================================"
                '''
            }
        }

        stage('Verify Source') {
            steps {
                sh '''
                    echo "Checking project files..."

                    test -f Dockerfile || test -f dockerfile
                    test -f package.json
                    test -f server.js

                    echo "Project verified."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    echo "Building Docker Image..."

                    docker build --no-cache \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} .

                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} \
                        ${IMAGE_NAME}:latest
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
                    echo "Deploying Container..."

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
                    echo "Waiting for application..."

                    sleep 20

                    echo "Checking root endpoint..."
                    curl --fail http://localhost:${HOST_PORT}/

                    echo "Checking Docker container..."
                    docker ps | grep ${CONTAINER_NAME}

                    echo "Health check completed."
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    echo "Cleaning unused Docker resources..."

                    docker image prune -af || true
                '''
            }
        }
    }

    post {

        success {
            echo "========================================"
            echo "Deployment Successful"
            echo "Application : ${IMAGE_NAME}"
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Docker Tag  : ${IMAGE_TAG}"
            echo "========================================"
        }

        failure {
            echo "========================================"
            echo "Deployment Failed"
            echo "========================================"

            sh '''
                echo "Container Logs:"
                docker logs ${CONTAINER_NAME} || true
            '''
        }

        always {
            cleanWs()
        }
    }
}
