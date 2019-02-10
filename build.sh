#!/bin/bash
docker build -t registry.fh.guelland.eu:8082/coffee_weight_state_machine .
docker push registry.fh.guelland.eu:8082/coffee_weight_state_machine