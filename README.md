# FLoCI EC2 deployment

The GitHub Actions workflow deploys this app to a Docker-enabled FLoCI EC2
instance over SSH. It builds the image on the instance; it does not use ECR or
ECS. Each deployment replaces the `ec2-docker-cicd-app` container, so its
in-memory faculty records are lost.

## Prerequisites

- A Windows x64 self-hosted GitHub Actions runner with Git and OpenSSH (`ssh`
  and `scp`) available. The runner must reach the instance's SSH port.
- A running FLoCI EC2 instance with `tar`, `scp`, and a running Docker
  daemon. The SSH user must be allowed to use Docker. FLoCI EC2 instances are
  themselves containers; Docker must be configured inside the guest or
  otherwise provided to it. Installing the Docker client alone is insufficient.
- The instance must allow access to application port 4000. For FLoCI, provide
  host-port forwarding for the instance.
- An SSH key authorized on the instance and its verified SSH host public key.
  Docker access grants substantial control over the host, so use a trusted
  runner and an isolated environment.

The local instance `i-252ee308f375626ed` exposes SSH on `127.0.0.1:2200`.
Docker and `tar` were installed in this guest, and a Docker daemon was started
with the `vfs` storage driver. The host container `floci-ec2-app-forward`
forwards **only** `127.0.0.1:4000` to the guest's port 4000. The EC2 app is
available at `http://127.0.0.1:4000/`. The old ECS service was scaled to zero
to release that host port.

This FLoCI guest uses `tail` rather than systemd as PID 1, so the Docker daemon
does not automatically start when the guest restarts. Restart it with the
following command, and wait for `docker info` to succeed before deploying:

```powershell
docker exec floci-aws-ec2-i-252ee308f375626ed sh -c 'nohup dockerd --storage-driver=vfs > /var/log/ec2-dockerd.log 2>&1 < /dev/null &'
docker exec floci-aws-ec2-i-252ee308f375626ed docker info
```

The forwarder has a Docker restart policy, but it requires the `coding_default`
network and the named FLoCI instance. Guest replacement may require provisioning
the instance and forwarding again. No security-group rule was added.

## GitHub Actions configuration

Set these repository **variables**:

| Variable | Description |
| --- | --- |
| `EC2_HOST` | SSH host, for example `127.0.0.1` for the local instance |
| `EC2_PORT` | SSH port, for example `2200` |
| `EC2_USER` | SSH login user; FLoCI's key injection normally uses `root` |

Set these repository **secrets**:

| Secret | Description |
| --- | --- |
| `EC2_SSH_PRIVATE_KEY` | Private key corresponding to the instance's authorized key |
| `EC2_SSH_KNOWN_HOSTS` | Verified OpenSSH `known_hosts` entry for the host and port |

For a nonstandard SSH port, a `known_hosts` entry uses `[host]:port` as its
first field. Obtain the host public key through a trusted channel and verify its
fingerprint independently before storing the entry. Do not commit the private
key. The workflow stores temporary SSH files in an access-restricted runner
directory and removes them after the job.

For the local instance, its public host key can be read from the guest with
`docker exec floci-aws-ec2-i-252ee308f375626ed cat /etc/ssh/ssh_host_ed25519_key.pub`.
Prefix its key type and public-key fields with `[127.0.0.1]:2200` to form the
known-hosts entry: `[127.0.0.1]:2200 <key-type> <public-key>`.

Push to `main` or run the workflow manually. It archives the checked-out commit,
uploads it over SSH, builds the image, and replaces the instance's container.
It does not verify application readiness; check the forwarded application URL
and the GitHub Actions log after deployment.
