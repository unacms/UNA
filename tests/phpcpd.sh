find .. \
  -type d -name updates -prune -o \
  -type d -name plugins -prune -o \
  -type d -name plugins_public -prune -o \
  -type d -name cache -prune -o \
  -type d -name cache_public -prune -o \
  -type d -name storage -prune -o \
  -type d -name logs -prune -o \
  -type d -name tmp -prune -o \
  -type d -name samples -prune -o \
  -type d -path './upgrade' -prune -o \
  -type d -path './modules/boonex/membership_pricing' -prune -o \
  -type f -name '*.php' \
  ! -name 'header.inc.php' \
  ! -name 'BxTemplStudioFormsField.php' \
  ! -name 'config.php' \
  -print \
| xargs -r php8.3 -d memory_limit=512M /usr/bin/phpcpd.phar --min-lines 6 --log-pmd ../logs/phpcpd.xml
