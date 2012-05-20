Name:           mongovision
Summary:        MongoVision is a web front-end for MongoDB.
Version:        1.1
Release:        0
Group:          Three Crickets
License:        ApacheV2

%description 
MongoVision is a web front-end for MongoDB.

%prep

%build

%clean 

%install

%post
mkdir -p /usr/lib/mongovision/.sincerity

mkdir -p /var/logs/mongovision
chmod a+w /var/logs/mongovision
ln -fsT /var/logs/mongovision /usr/lib/mongovision/logs

mkdir -p /var/cache/mongovision
chmod a+w /var/cache/mongovision
ln -fsT /var/cache/mongovision /usr/lib/mongovision/cache 

chmod a+w -R /var/lib/mongovision
chmod a+w -R /etc/mongovision

ln -fsT /var/lib/mongovision/programs /usr/lib/mongovision/programs 
ln -fsT /var/lib/mongovision/libraries /usr/lib/mongovision/libraries 
ln -fsT /var/lib/mongovision/component /usr/lib/mongovision/component 
ln -fsT /etc/mongovision /usr/lib/mongovision/configuration 

%preun
rm -rf /usr/lib/mongovision/.sincerity
rm -f /usr/lib/mongovision/logs
rm -f /usr/lib/mongovision/cache
rm -f /usr/lib/mongovision/programs
rm -f /usr/lib/mongovision/libraries
rm -f /usr/lib/mongovision/component
rm -f /usr/lib/mongovision/configuration

%files
/*

%changelog
* Thu May 10 2012 Tal Liron <tal.liron@threecrickets.com>
- Initial release
