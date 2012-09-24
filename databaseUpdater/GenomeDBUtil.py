'''
    Utility functions that can be reused across the website such as running formatdb
    on a new fasta file or hooking up a gff file to Chado and GBrowse. 
    
    Author: Andrew Oberlin
    Date: September 10, 2012
'''
import os
from SubProcess import runProgram
import shutil
from BCBio.GFF import GFFExaminer
os.putenv('DJANGO_SETTINGS_MODULE', '/var/www/mycoplasma_site/settings.py')
from django.conf import settings 

GBROWSE_DIR='/etc/gbrowse2/'

'''
    Runs formatdb on the fasta file given. The output of the formatdb operation
    will be stored in either loc + '/proteinDB' or loc + '/nucleotideDB'
    
    @param fastaName: the basename of the fasta file
    @param loc: the organism directory of the fasta file
    @param protein: whether or not this is a protein database
''' 
def runFormatDB(self, fastaName, loc, newOrOldDir, protein=False):
        option = 'F'
        dbDir = 'nucleotideDB'
        if (protein):
            option = 'T'
            dbDir = 'proteinDB'
            
        # must move the file into the new directory to correctly place the
        # formatdb information
        loc = newOrOldDir + loc
        newLoc = os.path.join(loc, dbDir)
        originalFile = os.path.join(loc, fastaName)
        newFile = os.path.join(newLoc, fastaName)
        
        shutil.move(originalFile, newLoc)
             
        args = ['-p', option, '-i', ]
        runProgram('formatdb', args)
        
        shutil.move(newFile, loc)
        
'''
    Changes a current entry in GBrowse for this gffFile
    
    @param gffFile: the absolute path of the gff file
    @param dbName: the basename of the database name file
    @param organismName: the name of the organism being added
'''
def editGBrowseEntry(gffFile, dbName, organismName):
    examiner = GFFExaminer()
    gffHandle = open(gffFile)
    landmark = examiner.available_limits(gffHandle)['gff_id'].keys()[0][0]
    organism = organismName.replace(' ', '_').lower()
    gbrowseConf = os.path.join(GBROWSE_DIR, organism + '.conf')
    if (os.path.isfile(gbrowseConf)):
        conf = open(gbrowseConf, 'r')
        confLines = conf.readlines()
        conf.close()
        changedInitial = False
        changedExample = False
        for(counter, line) in enumerate(confLines):
            if (line[:15] == 'initial landmark'):
                initialLandmarkArr = line.split("=")
                initialLandmarkArr[1] = ' ' + landmark + ':1...50000\n'
                confLines[counter] = '='.join(initialLandmarkArr)
                changedInitial = True
            elif(line[:8] == 'examples'):
                exampleArr = line.split("=")
                exampleArr[1] = ' ' + landmark + '\n'               
                confLines[counter] = '='.join(exampleArr)
                changedExample = True
            if (changedInitial and changedExample):
                break
        conf = open(gbrowseConf, 'w+b')
        conf.writelines(confLines)
        conf.close()             
    else:
        dataSource = os.path.join(os.path.dirname(gffFile), dbName)
        createNewGBrowseEntry(landmark, dataSource, organismName)
        
'''
    Uses the template file in the GBrowse directory to create a new
    GBrowse configuration file for this organism
    
    @param landmark: the initial landmark of the gff for GBrowse
    @param dataSource: the absolute path of the data source (sqlite database)
    @param organismName: the name of the organism being added to GBrowse
'''
def createNewGBrowseEntry(landmark, dataSource, organismName):
    try:
        templateConfFile = open(os.path.join(GBROWSE_DIR, 'mycoplasma_template.conf'), 'r')
        templateConf = templateConfFile.readlines()
        templateConfFile.close()
    except:
        raise GBrowseEntryCreationException("Could not find the template file for adding the new entry to GBrowse")
    
    organism = organismName.replace(' ', '_').lower()
    changedDBArgs = False
    changedInitial = False
    changedExample = False
    for(counter, line) in enumerate(templateConf):
        if (line[:16] == 'initial landmark'):
            print line[:16]
            initialLandmarkArr = line.split("=")
            initialLandmarkArr[1] = ' ' + landmark + ':1...50000\n'
            templateConf[counter] = '='.join(initialLandmarkArr)
            changedInitial = True
        elif(line[:8] == 'examples'):
            exampleArr = line.split("=")
            exampleArr[1] = ' ' + landmark + '\n'               
            templateConf[counter] = '='.join(exampleArr)
            changedExample = True
        else:
            dataSourceLoc = line.find('-dsn')
            if (dataSourceLoc != -1):
                dataSourceLoc += 4
                templateConf[counter] = line[:dataSourceLoc] + " '" + dataSource + "'\n"
                changedDBArgs = True
        if (changedInitial and changedExample and changedDBArgs):
            break

    try:
        newConf = open(os.path.join(GBROWSE_DIR, organism + ".conf"), 'w')
        newConf.writelines(templateConf)
        newConf.close()
    except:
        raise GBrowseEntryCreationException("Could not create a new configuration file for " + organism)

    try:
        gbrowseConf = open(os.path.join(GBROWSE_DIR, 'GBrowse.conf'), 'a')
        appendStr = "\n[" + organism.lower() + "]\ndescription  = " + organismName + "\npath         = " + organism + ".conf"

        gbrowseConf.write(appendStr)
        gbrowseConf.close()
    except:
        raise GBrowseEntryCreationException("Could not add the entry for " + organismName + " to the main GBrowse configuration.")

class GBrowseEntryCreationException(Exception):
    pass