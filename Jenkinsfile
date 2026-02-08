pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'devops-taskboard'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        JEST_JUNIT_OUTPUT_DIR = 'test-results'
    }

    triggers {
        pollSCM('* * * * *')
    }

    stages {
        stage('Build') {
            steps {
                echo 'Stage 1: Build - Installing dependencies...'
                bat 'npm install'
                echo 'Build stage completed successfully.'
            }
        }

        stage('Test') {
            steps {
                echo 'Stage 2: Test - Running backend unit tests...'
                bat 'set JEST_JUNIT_OUTPUT_DIR=test-results&& set JEST_JUNIT_OUTPUT_NAME=backend-results.xml&& npm run test-backend -- --reporters=default --reporters=jest-junit'
                echo 'Running API tests...'
                bat 'set JEST_JUNIT_OUTPUT_DIR=test-results&& set JEST_JUNIT_OUTPUT_NAME=api-results.xml&& npm run test-api -- --reporters=default --reporters=jest-junit'
                echo 'Test stage completed successfully.'
            }
            post {
                always {
                    junit 'test-results/*.xml'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Stage 3: Deploy - Building Docker image...'
                bat "docker build -t %DOCKER_IMAGE%:%DOCKER_TAG% ."
                bat "docker tag %DOCKER_IMAGE%:%DOCKER_TAG% %DOCKER_IMAGE%:latest"

                echo 'Loading image into Minikube...'
                bat "minikube image load %DOCKER_IMAGE%:latest"

                echo 'Applying Kubernetes manifests...'
                bat 'kubectl apply -f deployment.yaml'
                bat 'kubectl apply -f service.yaml'

                echo 'Restarting deployment to pick up new image...'
                bat 'kubectl rollout restart deployment/devops-taskboard'
                bat 'kubectl rollout status deployment/devops-taskboard --timeout=60s'

                echo 'Deploy stage completed successfully.'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! All stages passed.'
            emailext(
                subject: "Build SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The build was successful.\n\nJob: ${env.JOB_NAME}\nBuild: #${env.BUILD_NUMBER}\nURL: ${env.BUILD_URL}",
                to: 'student@email.com'
            )
        }
        failure {
            echo 'Pipeline failed. Check the logs for details.'
            emailext(
                subject: "Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The build failed. Check console output.\n\nJob: ${env.JOB_NAME}\nBuild: #${env.BUILD_NUMBER}\nURL: ${env.BUILD_URL}",
                to: 'student@email.com'
            )
        }
    }
}
