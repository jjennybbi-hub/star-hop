#!/usr/bin/env python3
"""Serve Star Hop to a VR headset on the same Wi-Fi as this computer.

Headsets only start VR on secure (https) pages, so this makes a private certificate
for this computer and serves the app over https. Run it, then type the address it
prints into the Meta Quest Browser. Press Control-C to stop.

Only the app's own files are served: index.html, sky-*.js and art/*.png.
"""
import http.server
import os
import socket
import ssl
import subprocess
import sys
import tempfile
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
PORTS = (8443, 8444, 8445, 9443)


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))       # sends nothing; just picks the network this Mac is on
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def make_cert(ip, folder):
    key, crt, cfg = (os.path.join(folder, n) for n in ('key.pem', 'cert.pem', 'openssl.cnf'))
    with open(cfg, 'w') as f:
        f.write('[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n'
                '[dn]\nCN=Star Hop on this computer\n'
                f'[ext]\nsubjectAltName=IP:{ip},IP:127.0.0.1,DNS:localhost\nbasicConstraints=CA:FALSE\n')
    subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '30',
                    '-keyout', key, '-out', crt, '-config', cfg], check=True, capture_output=True)
    return crt, key


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def send_head(self):
        path = urllib.parse.unquote(self.path.split('?', 1)[0].split('#', 1)[0])
        if path in ('', '/'):
            path = '/index.html'
        name = path.rsplit('/', 1)[-1]
        allowed = '..' not in path and (
            path == '/index.html'
            or (path.count('/') == 1 and name.startswith('sky-') and name.endswith('.js'))
            or (path.startswith('/art/') and path.count('/') == 2 and name.endswith('.png')))
        if not allowed:
            self.send_error(404)
            return None
        self.path = path
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def guess_type(self, path):
        t = super().guess_type(path)
        return t + '; charset=utf-8' if t in ('text/html', 'application/javascript', 'text/javascript') else t

    def log_message(self, fmt, *args):
        pass


def main():
    local_only = '--local' in sys.argv
    ip = '127.0.0.1' if local_only else lan_ip()
    if not ip:
        sys.exit('This computer is not connected to a network. Join the same Wi-Fi as the headset and run this again.')
    crt, key = make_cert(ip, tempfile.mkdtemp(prefix='starhop-'))
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(crt, key)
    httpd = None
    for port in PORTS:
        try:
            httpd = http.server.ThreadingHTTPServer(('127.0.0.1' if local_only else '0.0.0.0', port), Handler)
            break
        except OSError:
            continue
    if not httpd:
        sys.exit('Could not open a port. Close other copies of this script and try again.')
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    url = f'https://{ip}:{port}'
    print(f'''
  Star Hop is ready for your headset.

  1. Put on the Quest and open the Browser app.
  2. Type this address exactly:   {url}
  3. The browser warns "Your connection is not private" — that is this
     computer's home-made certificate. Choose Advanced, then Proceed.

  Keep this window open while you use the headset. Press Control-C to stop.
''', flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  Stopped.')


if __name__ == '__main__':
    main()
