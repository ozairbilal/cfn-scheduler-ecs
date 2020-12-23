var aws = require('aws-sdk');

exports.handler = function(event, context, callback) {
  var ecsRegion = 'eu-west-1';
  var maxCount = 1;
  var datetime = new Date();
  var hour = datetime.getHours();
  // UAE TIMEZONE
  hour = hour + 4;
  var ecs = new aws.ECS({ region: ecsRegion });
  var output;
  ecs.listClusters({}, function(err, clusters) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      for (const activeCluster in clusters.clusterArns) {
        ecs.listServices({ cluster: clusters.clusterArns[activeCluster] }, function(err, services) {
          if (err) console.log(err, err.stack);
          else {
            for (const activeServices in services.serviceArns) {
              output = ecs.describeServices({
                services: [services.serviceArns[activeServices]],
                cluster: clusters.clusterArns[activeCluster]
              }, function(err, data) {
                if (err) {
                  console.log(err, err.stack);
                }
                else {
                  var desiredCount = data.services[0].desiredCount;
                  if (event.source === 'aws.events') {
                    if ((hour > 19) && (hour < 6)) {
                      // Do the shutdown
                      console.log("Turning Down the service", data.services[0].serviceName);
                      if (desiredCount > 0)
                        desiredCount--;
                    }
                    else {
                      // Bootup the ecs
                      console.log("Starting the service", data.services[0].serviceName);
                      desiredCount = 1;
                    }
                  }
                  else{
                    console.log("called by api gateway");
                  }
                  var params = {
                    cluster: clusters.clusterArns[activeCluster],
                    service: data.services[0].serviceArn,
                    desiredCount: desiredCount
                  };
                  ecs.updateService(params, function(err, data) {
                    if (err) { console.log(err, err.stack); }
                    else {
                      console.log(data);
                      context.succeed();
                    }
                  });
                }
              });
            }
          }
        });
      }
    }
  })
  callback(null, output);
};
