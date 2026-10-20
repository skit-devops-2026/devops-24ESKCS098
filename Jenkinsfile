pipeline {
    agent any

    tools {
        nodejs 'NodeJS' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Install node modules
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                // Build the Vite project
                sh 'npm run build'
            }
        }
    }
    
    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Build successful!"
        }
        failure {
            echo "Build failed."
        }
    }
}
