module.exports=function(grunt){    

    grunt.loadNpmTasks('grunt-express-server');


    grunt.initConfig({   

    express: {
               options: {              
                     port:8080
                        },
               dev: {
                     options: {
                          script: 'app.js'
                              }
                    }
            }


  });

    grunt.registerTask('default', [ 'express:dev' ])

}