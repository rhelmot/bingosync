{
  lib,
  pkgs,
  config,
}:
let
  cfg = config.services.bingosync;
  pythonEnv = pkgs.python3.withPackages (p: with p; [
    gunicorn
    certifi
    chardet
    django_4
    django-bootstrap4
    django-crispy-forms
    #django-url-tools
    dj-database-url
    idna
    pytz
    requests
    six
    #tdlib
    tornado
    urllib3
    gunicorn
  ] ++ cfg.extraPythonPackages p);
in {
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
    wsgiSocket = lib.mkOption {
      type = lib.types.str;
      default = "/var/run/bingosync/wsgi.sock";
      description = "The path to the wsgi socket to serve";
    };
    staticPath = lib.mkOption {
      type = lib.types.str;
      default = "/var/lib/bingosync/static";
      description = "The path to the static files to serve at /static";
    };
    extraPythonPackages = lib.mkOption {
      type = lib.types.functionTo (lib.types.listOf lib.types.package);
      default = p: [];
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
    threads = lib.option {
      type = lib.types.int;
      default = 10;
      description = "The number of gunicorn worker threads to spawn";
    };
    debug = lib.option {
      type = lib.types.bool;
      default = false;
      description = "Enable debugging features for localhost";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.bingosync = {
      wantedBy = [ "multi-user.target" ];
      requires = [ "bingosync-django.unit" "bingosync-ws.unit" ];
    };
    systemd.services.bingosync-django = {
      inherit (cfg) user;
      runtimeDirectory = "bingosync";
      path = [ pythonEnv ];
      environment = {
        DOMAIN = cfg.domain;
        SOCKETS_DOMAIN = cfg.socketsDomain;
        DB_STRING = cfg.databaseUrl;
      } // lib.optionalAttrs cfg.debug {
        DEBUG = 1;
      };
      preStart = ''
        if ! [[ -f ${cfg.staticPath} ]]; then
          (umask 077; head /dev/urandom | md5sum | cut -d' ' -f1 >${cfg.staticPath})
        fi
        export SECRET_KEY="$(cat "${cfg.staticPath}")"
        python ${../bingosync-app/manage.py} collectstatic
      '';
      script = ''
        gunicorn --bind unix:${cfg.wsgiSocket} --umask 0o111 --chdir ${../bingosync-app} --threads ${cfg.threads} --capture-output bingosync.wsgi:application
      '';
    };
    systemd.services.bingosync-ws = {
      inherit (cfg) user;
      path = [ pythonEnv ];
      environment = {
        DOMAIN = cfg.domain;
      } // lib.optionalAttrs cfg.debug {
        DEBUG = 1;
      };
      script = ''
        python bingosync/bingosync-websocket/app.py
      '';
    };

    systemd.tmpfiles.settings.bingosync = {
      "${cfg.staticPath}".d = {
        user = cfg.user;
        group = cfg.group;
      };
    };

    config.users.users.bingosync = {
      inherit (cfg) group;
    };
    config.users.groups.${cfg.group} = { };
  };
}
