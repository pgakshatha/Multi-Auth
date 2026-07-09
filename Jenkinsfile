pipeline {
    agent any

    environment {
        AWS_REGION = "ap-south-1"
        ECR_REGISTRY = "218014315199.dkr.ecr.ap-south-1.amazonaws.com"
        ECR_REPOSITORY = "multi-auth"

        IMAGE_NAME = "multi-auth"
        IMAGE_TAG = "${BUILD_NUMBER}"

        CONTAINER_NAME = "multi-auth"
        CONTAINER_PORT = "5001"
        APP_PORT = "5000"

        ENV_FILE = "/opt/multi-auth/.env"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Checking out source code..."
                git branch: 'main',
                    url: 'https://github.com/pgakshatha/Multi-Auth.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker Image..."

                sh '''
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                echo "Logging into Amazon ECR..."

                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Tag Docker Images') {
            steps {
                echo "Tagging Docker Images..."

                sh '''
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

                    docker tag ${IMAGE_NAME}:latest ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                echo "Pushing Docker Images to Amazon ECR..."

                sh '''
                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                echo "Deploying Multi-Auth..."

                sh '''
                    docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p ${CONTAINER_PORT}:${APP_PORT} \
                        --env-file ${ENV_FILE} \
                        ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo "Checking Application Health..."

                sh '''
                    sleep 20

                    curl --fail http://localhost:5001/
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo "Cleaning Docker Images..."

                sh '''
                    docker image prune -af || true
                '''
            }
        }
    }

    post {

        success {
            echo "=========================================="
            echo "Multi-Auth Deployment Successful"
            echo "Build Number : ${BUILD_NUMBER}"
            echo "Docker Image : ${IMAGE_NAME}:${IMAGE_TAG}"
            echo "=========================================="
        }

        failure {
            echo "=========================================="
            echo "Multi-Auth Deployment Failed"
            echo "=========================================="
        }

        always {
            cleanWs()
        }
    }
}
