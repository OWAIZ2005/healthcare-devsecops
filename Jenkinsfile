
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Automated Tests') {
            steps {
                dir('app') {
                    sh 'npm test'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=healthcare-api \
                            -Dsonar.projectName='Healthcare API' \
                            -Dsonar.sources=app \
                            -Dsonar.tests=app \
                            -Dsonar.test.inclusions=app/**/*.test.js \
                            -Dsonar.exclusions=app/node_modules/**,app/coverage/** \
                            -Dsonar.javascript.lcov.reportPaths=app/coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()

                        if (qg.status != 'OK') {
                            error "Quality Gate failed: ${qg.status}"
                        }

                        echo 'Quality Gate passed!'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t healthcare-api:v2 .'
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh '''
                    trivy image \
                    --severity HIGH,CRITICAL \
                    --exit-code 0 \
                    healthcare-api:v2
                '''
            }
        }
        
        stage('Push Docker Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )
                ]) {
                    sh '''
                        set +x

                        printf '%s' "$DOCKERHUB_PASSWORD" | docker login \
                            --username "$DOCKERHUB_USERNAME" \
                            --password-stdin

                        docker tag healthcare-api:v2 owaiz2005/healthcare-api:v2

                        docker push owaiz2005/healthcare-api:v2

                        docker logout
                    '''
                }
            }
        }



        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    export KUBECONFIG=/var/jenkins_home/.kube/config

                    kubectl set image deployment/healthcare-api healthcare-api=owaiz2005/healthcare-api:v2

                    kubectl rollout restart deployment/healthcare-api

                    kubectl rollout status deployment/healthcare-api --timeout=180s
                '''
            }
        }
    }
}