{
  outputs =
    { ... }:
    {
      nixosModules.default =
        {
          lib,
          pkgs,
          config,
          ...
        }:
        let
          cfg = config.services.bingosync;
          pythonEnv = pkgs.python3.withPackages (
            p:
            with p;
            [
              gunicorn
              certifi
              chardet
              django_4
              django-bootstrap3
              django-crispy-forms
              django-crispy-bootstrap3
              dj-database-url
              idna
              pytz
              requests
              requests-unixsocket
              six
              tornado
              urllib3
            ]
            ++ cfg.extraPythonPackages p
          );
        in
        {
          options.services.bingosync = {
            enable = lib.mkEnableOption "bingosync";
            user = lib.mkOption {
              type = lib.types.str;
              default = "bingosync";
              description = "The user to run the bingosync servers as";
            };
            group = lib.mkOption {
              type = lib.types.str;
              default = "bingosync";
              description = "The group to put the bingosync user under, if applicable";
            };
            httpSocket = lib.mkOption {
              type = lib.types.str;
              default = "/run/bingosync/http.sock";
              description = "The path to use for the http socket";
            };
            wsSocket = lib.mkOption {
              type = lib.types.str;
              default = "/run/bingosync-ws/ws.sock";
              description = "The path to use for the websocket service unix socket";
            };
            staticPath = lib.mkOption {
              type = lib.types.str;
              default = "/var/lib/bingosync/static";
              description = "The path to the static files to serve at /static";
            };
            extraPythonPackages = lib.mkOption {
              type = lib.types.functionTo (lib.types.listOf lib.types.package);
              default = p: [ ];
              defaultText = "p: []";
              description = "Any extra python packages to add to the environment, for example sql drivers";
            };
            domain = lib.mkOption {
              type = lib.types.str;
              description = "The domain name that the site is hosted at";
            };
            socketsDomain = lib.mkOption {
              type = lib.types.str;
              description = "The domain name that the socket server is hosted at";
            };
            databaseUrl = lib.mkOption {
              type = lib.types.str;
              description = "The dj_database_url specification to connect to";
            };
            threads = lib.mkOption {
              type = lib.types.int;
              default = 10;
              description = "The number of gunicorn worker threads to spawn";
            };
            debug = lib.mkOption {
              type = lib.types.bool;
              default = false;
              description = "Enable debugging features for localhost";
            };

            addNginxConfig = lib.mkOption {
              type = lib.types.bool;
              default = true;
              description = ''
                Add configuration elements `services.nginx.virtualHosts.''${domain}` and `services.nginx.virtualHosts.''${socketsDomain}`
              '';
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services.bingosync = {
              path = [ pythonEnv pkgs.nodejs ];
              environment =
                {
                  DOMAIN = cfg.domain;
                  SOCKETS_DOMAIN = cfg.socketsDomain;
                  DB_STRING = cfg.databaseUrl;
                  STATIC_ROOT = cfg.staticPath;
                  WS_SOCK = cfg.wsSocket;
                  HTTP_SOCK = cfg.httpSocket;
                }
                // lib.optionalAttrs cfg.debug {
                  DEBUG = "1";
                };
              wantedBy = [ "multi-user.target" ];
              requires = [ "bingosync-ws.service" ];
              preStart = ''
                if ! [[ -f /var/lib/bingosync/secret ]]; then
                  (umask 077; head /dev/urandom | md5sum | cut -d' ' -f1 >/var/lib/bingosync/secret)
                fi
                export SECRET_KEY="$(cat /var/lib/bingosync/secret)"
                python manage.py collectstatic --noinput
                python manage.py migrate
              '';
              script = ''
                gunicorn --bind unix:${cfg.httpSocket} --umask 0o111 --threads ${builtins.toString cfg.threads} --capture-output bingosync.wsgi:application
              '';
              serviceConfig = {
                User = cfg.user;
                RuntimeDirectory = "bingosync";
                WorkingDirectory = ./bingosync-app;
              };
            };
            systemd.services.bingosync-ws = {
              path = [ pythonEnv ];
              environment =
                {
                  DOMAIN = cfg.domain;
                  WS_SOCK = cfg.wsSocket;
                  HTTP_SOCK = cfg.httpSocket;
                }
                // lib.optionalAttrs cfg.debug {
                  DEBUG = "1";
                };
              script = ''
                python "${./bingosync-websocket/app.py}"
              '';
              serviceConfig = {
                User = cfg.user;
                RuntimeDirectory = "bingosync-ws";
              };
            };

            systemd.tmpfiles.settings.bingosync = {
              "/var/lib/bingosync".d = {
                user = cfg.user;
                group = cfg.group;
              };
              "${cfg.staticPath}".d = {
                user = cfg.user;
                group = cfg.group;
              };
            };

            users.users.bingosync = lib.mkIf (cfg.user == "bingosync") {
              isSystemUser = true;
              inherit (cfg) group;
            };
            users.groups.${cfg.group} = { };

            services.nginx = lib.mkIf cfg.addNginxConfig {
              enable = true;
              virtualHosts = {
                "${cfg.domain}" = {
                  locations = {
                    "/".proxyPass = "http://unix:${cfg.httpSocket}";
                    "/static/".alias = "${cfg.staticPath}/";
                  };
                };
                "${cfg.socketsDomain}" = {
                  locations."/" = {
                    proxyPass = "http://unix:${cfg.wsSocket}";
                    proxyWebsockets = true;
                  };
                };
              };
            };

          };
        };
    };
}
