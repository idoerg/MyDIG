MyDIG
=====

Instructions for fresh install of Django Based Mycoplasma Database:

Prerequisites: (THIS IS THE HARDEST PART)
    Django - Web framework used for website -- https://docs.djangoproject.com/en/1.3/topics/install/
    PostgreSQL - database system used for website -- aptitude install postgresql-8.4
    MySQL - database system used with a GO database clone
    Apache - Web Server for Django -- aptitude install apache2
    mod-wsgi - mod for Apache for Django -- aptitude install libapache2-mod-wsgi
    GBrowse - genome browser used -- http://gmod.org/wiki/GBrowse_2.0_Install_HOWTO (WATCH FOR PREREQUISITES)
    Chado - database schema used for organism database 
            -- http://gmod.svn.sourceforge.net/viewvc/gmod/schema/trunk/chado/INSTALL.Chado (You may only need the prerequisites with the dump)
    SQLite - database used to back GBrowse 
    	-- CPAN DBD::SQLite for adaptor
    	-- aptitude install sqlite3
    Django files - the package (files) in order to create the website
    BioPerl - http://www.bioperl.org/wiki/Installing_BioPerl_on_Ubuntu_Server

Instructions:

1. Clone git repository into /var/www/

2. Change name of folder from MyDIG to mycoplasma_site

3. Add Alias to apache2.conf (or httpd.conf) file
    -typically located in /etc/apache2/
    -command: WSGIScriptAlias / /var/www/mycoplasma_site/apache/django.wsgi

4. Create a user for the psql databases with username/passwords given in settings.py and grant
all privileges to this user on the databases

5. Create the same user in MySQL. Clone the GO database at http://www.geneontology.org/GO.downloads.ontology.shtml.
get the database dump for MySQL that is updated daily

6. Once all databases created, in /var/www/mycoplasma_site/ run: python manage.py syncdb

7. Alter the table "organism" in the chado database using the statement: ALTER TABLE organism DROP CONSTRAINT "organism_c1". 
Otherwise, the database will not allow the same species in value in the species column, which we need.

*8. Test to see what is working: If GBrowse is not working check your machine's URL for GBrowse then go into 
    /var/www/mycoplasma_site/mycoplasma_home/templates/public/gbrowse.html and replace the iframe src with that URL
   
 9. In your terminal, move to the directory /var/www/mycoplasma_site/databaseUpdater. Run the following command:
 					python GenomeUpdater.py
