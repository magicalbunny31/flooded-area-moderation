pipeline {
   agent {
      node {
         label "fox-0 apps"
      }
   }

   stages {
      stage("build") {
         steps {
            echo "✨ building.."
            dir("src") {
               withCredentials([ file(credentialsId: "DOTENVX_ENV_KEYS_FLOODED_AREA_MODERATION", variable: "DOTENVX_ENV_KEYS") ]) {
                  writeFile file: ".env.keys", text: readFile(DOTENVX_ENV_KEYS), encoding: "UTF-8"
               }
            }
         }
      }
      stage("start") {
         steps {
            echo "✨ starting.."
            sh "docker compose down --remove-orphans --rmi all --volumes"
            sh "docker compose up --build --detach"
         }
      }
   }

   post {
      cleanup {
         echo "✨ cleaning up.."
         dir("${workspace}@tmp") {
            deleteDir()
         }
         sh "docker builder prune --all --force"
      }
   }
}