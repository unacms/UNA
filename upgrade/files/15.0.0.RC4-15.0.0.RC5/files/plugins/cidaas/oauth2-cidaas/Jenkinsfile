pipeline {
    agent { dockerfile true }
    stages {
        stage('Test') {
            steps {
                script {
                    sh 'COMPOSER_HOME=$(pwd) ./docker/install-composer.sh'
                    sh 'COMPOSER_HOME=$(pwd) ./composer.phar i'
                    sh './vendor/bin/phpunit --log-junit reports/report.xml'
                }
            }
        }
    }

    post {
        always {
            junit 'reports/*.xml'
        }
    }
}
