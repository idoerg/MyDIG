from django.http import HttpResponse, HttpResponseRedirect
from mycoplasma_home.models import NavBarOption, Pictures, PictureTypes, PictureProps
from mycoplasma_home.models import TagPoint, TagGroup
from mycoplasma_home.models import PictureDefinitionTag, GenomeUpload, BlastUpload, Landmark

from multiuploader.models import Image

from mycoplasma_home.chado import Organism
from django.db.models import Q

from django.template import Context, loader, RequestContext
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.core.urlresolvers import reverse
import math
from django.views.decorators.csrf import csrf_exempt
import os 
import subprocess                    
from django.conf import settings  
from django.contrib.auth import *            
from django.core.files.images import ImageFile 
from django.shortcuts import redirect    
from static.python_scripts.gff_prep import GFFRewriter


# navigation bar setup method
def navBar():
    optionsList = NavBarOption.objects.all().order_by('rank')

    bannertype_obj = PictureTypes.objects.get(imageType__exact="banner")
    banner_img = PictureProps.objects.get(type_id__exact=bannertype_obj.pk).picture_id
    banner_url = banner_img.imageName
    
    # should be same as MEDIA_URL in settings.py
    media_url = "/media/"
    
    return (optionsList, banner_url, media_url) 

# Create your views here.
def home(request):
    navBarConfig = navBar()
    optionsList = navBarConfig[0]
    banner_url = navBarConfig[1]
    media_url = navBarConfig[2]
    
    if (request.method == "GET"):
        if (request.GET.has_key('add_login')):                
            is_admin_page = request.GET['add_login']
        else:
            is_admin_page = False
    else:
        is_admin_page = False
    
    all_mycoplasma = Organism.objects.filter(genus__exact="Mycoplasma").order_by('species')
    
    template = loader.get_template('mycoplasma_home/index.html')
    context = RequestContext(request, {
        'optionsList': optionsList,
        'banner_url': banner_url,
        'MEDIA_URL': media_url,
        'all_mycoplasma' : all_mycoplasma,
        'is_admin_page' : is_admin_page,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context));
    
@csrf_exempt
def picture_editor(request, image_key):
    image = Pictures.objects.get(pk__exact=image_key)     
    
    navBarConfig = navBar()
    optionsList = navBarConfig[0]
    banner_url = navBarConfig[1]
    media_url = navBarConfig[2]    
    
    #static list of color options (controls creation of color pallete)
    color_options = [("red","255,0,0"),("blue","0,0,255"),("aqua","0,255,255"),("green","0,98,0"),
        ("lime","0,255,0"),("yellow","255,255,0"), ("silver","192,192,192")]
    
    tagGroups = TagGroup.objects.filter(picture__exact=image)
    
    tagTuples = list()
    
    for group in tagGroups:
        points = TagPoint.objects.filter(group__exact = group).order_by('rank')
        max_x = -1;
        max_y = -1;
        min_y = 10000000;
        for point in points:
            max_x = max(max_x, point.pointX)
            if (max_x == point.pointX and len(points) > 2):
                XPos = max_x
                YPos = point.pointY
            elif (max_x == point.pointX and len(points) == 2):
                XPos = max_x
                max_y = max(max_y,point.pointY)
                min_y = min(min_y, point.pointY)
        if (len(points) == 2):
            YPos = (max_y + min_y)/2
        tagTuples.append((group,points,XPos,YPos))
    
    template = loader.get_template('mycoplasma_home/imageEditorHolder.html')
    context = RequestContext(request, {
        'image': image,
        'optionsList': optionsList,
        'banner_url': banner_url,
        'MEDIA_URL': media_url,
        'color_options': color_options,
        'tagTuples': tagTuples,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context))
    
@csrf_exempt
def submit_tag(request, image_key):   
    if (request.method == "POST"):
        postDict = request.POST;
        try :
            descriptionIn = postDict['description']
            colorIn = postDict['color']
            shapeIn = postDict['shape']
            numPoints = int(postDict['numPoints'])
            image = Pictures.objects.get(pk__exact=image_key) 
            pointsArr = list()
            i = 0

            while (i < numPoints):
                pointsArr.append((postDict['point' + str(i) + '_x'], postDict['point' + str(i) + '_y']))
                i += 1
            
            tagShape = TagShape.objects.get(shape__exact=shapeIn)
            tagGroup = TagGroup(description=descriptionIn, color=colorIn, picture=image, shape=tagShape)            
            tagGroup.save()
            
            for (counter, point) in enumerate(pointsArr):
                tagPoint = TagPoint(group=tagGroup, pointX=point[0], pointY=point[1], rank = counter + 1)
                tagPoint.save()
            
            return HttpResponseRedirect(reverse('mycoplasma_home.views.picture_editor', args=(image_key,)))
        except (KeyError):
            error = "Error on key"; 
        except (ObjectDoesNotExist):
            error = "Error on tag shape" + shapeIn;
    else: 
        error = "Not a Post"
    return HttpResponse("Error: " + error)

@csrf_exempt    
def submit_blast(request):
    if (request.method == "POST"):
        postDict = request.POST
        fileDict = request.FILES
        response = ""
        if (postDict.has_key('blast_db')):    
            database = postDict['blast_db']
            
            root = settings.STATIC_ROOT
            media_root = settings.MEDIA_ROOT;
            
            landmark = Landmark.objects.get(organism_id__exact=int(database))
            os.system("formatdb -p F -i " + root + "/" + str(landmark.name).lower() + ".fasta")
            sequence = postDict['sequence']
            
            if (sequence != ""):
                
                tmp_fasta_file = open(root + "/tmp.fasta", "w")
                tmp_fasta_file.write(sequence)
                tmp_fasta_file.close()
                
                blast_result = os.popen("blastall -p blastn -d " + root + "/" + str(landmark.name).lower() + ".fasta -T T -i " + root + "/tmp.fasta")
                response = "<pre>" + " ".join(blast_result.readlines()) + "</pre>"
                                    
                os.system("rm " + root + "/" + str(landmark.name).lower() + ".fasta.n*")
                os.system("rm " + root + "/tmp.fasta")
                
            elif (fileDict.has_key('file')):
                uploadedFile = fileDict['file']
                fasta = BlastUpload(fasta_file=uploadedFile, name=uploadedFile.name)
                fasta.save()
                
                blast_result = os.popen("blastall -p blastn -d " + root + "/" + str(landmark.name).lower() + ".fasta -T T -i " + media_root + "/" + str(fasta.fasta_file))
                response = "<pre>" + " ".join(blast_result.readlines()) + "</pre>"
                                    
                os.system("rm " + root + "/" + str(landmark.name).lower() + ".fasta.n*")
                os.system("rm " + media_root + "/" + str(fasta.fasta_file))
                fasta.delete()
                
                #response = "blastall -p blastn -d " + root + "/" + landmark.name.lower() + ".fasta -m 0 -i " + media_root + "/" + str(fasta.fasta_file)
        # change this to the results page   
        #return HttpResponseRedirect(reverse('mycoplasma_home.views.blast'))
        return HttpResponse(response)
    else: 
        error = "Not a Post"
    return HttpResponse("Error: " + error)
    
def pictures_change(request):
    if (request.method == "GET"):
        media_url = "/media/"        
        if (request.GET.has_key('rangeX')):        
            rangeX = int(request.GET['rangeX'])
        else:
            rangeX = 0
        if (request.GET.has_key('rangeY')): 
            rangeY = int(request.GET['rangeY'])
        else:
            rangeY = 14

        search_for = ""
        allPics = True
        if (request.GET.has_key('organisms')):
            allPics = False
            organisms = request.GET['organisms']
        
        displayRange = (rangeX, rangeY)
        
        num_items_row = 5
        num_items_col = 3
        picsPerPage = num_items_row * num_items_col
        if (allPics == True):
            picture_props = PictureProps.objects.filter(type_id__imageType__exact = "database_photo")[rangeX:rangeY+1]
            picture_list = list()                
            for prop in picture_props:
                picture_list.append(prop.picture_id)
            numPicPages = PictureProps.objects.filter(type_id__imageType__exact = "database_photo").count()/picsPerPage + 1
        else:
            if (int(organisms) != -1):
                candidate = Organism.objects.get(pk__exact=int(organisms))                
                picture_def_tags = PictureDefinitionTag.objects.filter(organism_id__exact=candidate.pk)
            else:
                picture_def_tags = list()
            picture_list = list()                
            for tag in picture_def_tags:
                picture_list.append(tag.picture)
        # sets the number of pictures to display in a row of the picture table generated

        template = loader.get_template('mycoplasma_home/pictures.html')
        context = RequestContext(request, {
            'MEDIA_URL': media_url,
            'num_items_per_row': num_items_row,
            'picture_list' : picture_list,
	    'SITE_URL' : settings.SITE_URL
        })
        return HttpResponse(template.render(context))

def pictures(request):      
    if (request.method == "GET"):
        if (request.GET.has_key('rangeX')):        
            rangeX = int(request.GET['rangeX'])
        else:
            rangeX = 0
        if (request.GET.has_key('rangeY')): 
            rangeY = int(request.GET['rangeY'])
        else:
            rangeY = 14
        
        displayRange = (rangeX, rangeY)
        navBarConfig = navBar()
        optionsList = navBarConfig[0]
        banner_url = navBarConfig[1]
        media_url = navBarConfig[2] 
        
        num_items_row = 5
        num_items_col = 3
        picsPerPage = num_items_row * num_items_col      
        numPicPages = PictureProps.objects.filter(type_id__imageType__exact = "database_photo").count()/picsPerPage + 1
        picPageIndex = 1 + rangeX/picsPerPage
        # sets the number of pictures to display in a row of the picture table generated

        template = loader.get_template('mycoplasma_home/picturesHolder.html')
        context = RequestContext(request, {
            #'picture_list': picture_list,
            'optionsList': optionsList,
            'banner_url': banner_url,
            'MEDIA_URL': media_url,
            #'num_items_per_row': num_items_row,
            #'displayRange': displayRange,
            'pageIndex': picPageIndex,
            'picsPerPage': picsPerPage,
            'numPages': numPicPages,
            'is_search' : False,
	    'SITE_URL' : settings.SITE_URL
        })
        return HttpResponse(template.render(context))

def pictures_old(request, rangeX, rangeY):      

    displayRange = (int(rangeX), int(rangeY))
    navBarConfig = navBar()
    optionsList = navBarConfig[0]
    banner_url = navBarConfig[1]
    media_url = navBarConfig[2] 
    
    num_items_row = 5
    num_items_col = 3
    picsPerPage = num_items_row * num_items_col
    
    picture_list = PictureProps.objects.filter(type_id__imageType__exact = "database_photo")[int(rangeX):int(rangeY)+1]
    numPicPages = PictureProps.objects.filter(type_id__imageType__exact = "database_photo").count()/picsPerPage + 1
    picPageIndex = 1 + int(rangeX)/picsPerPage
    # sets the number of pictures to display in a row of the picture table generated

    template = loader.get_template('mycoplasma_home/picturesHolder.html')
    context = RequestContext(request, {
        'picture_list': picture_list,
        'optionsList': optionsList,
        'banner_url': banner_url,
        'MEDIA_URL': media_url,
        'num_items_per_row': num_items_row,
        #'displayRange': displayRange,
        'pageIndex': picPageIndex,
        'picsPerPage': picsPerPage,
        'numPages': numPicPages,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context))
    
def gbrowse(request):
    navBarConfig = navBar()
    optionsList = navBarConfig[0]
    banner_url = navBarConfig[1]
    media_url = navBarConfig[2]
    
    template = loader.get_template('mycoplasma_home/gbrowse.html')
    context = RequestContext(request, {
        'optionsList': optionsList,
        'banner_url': banner_url,
        'MEDIA_URL': media_url,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context))
    
def blast(request):
    navBarConfig = navBar()
    optionsList = navBarConfig[0]
    banner_url = navBarConfig[1]
    media_url = navBarConfig[2]
    
    blast_options = Organism.objects.filter(genus__exact='Mycoplasma')
    
    template = loader.get_template('mycoplasma_home/blast.html')
    context = RequestContext(request, {
        'optionsList': optionsList,
        'banner_url': banner_url,
        'MEDIA_URL': media_url,
        'blast_options': blast_options,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context))

@csrf_exempt 
def login_handler(request):
    if (request.method == "POST"):
        postDict = request.POST
        username = postDict['username']
        password = postDict['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
            else:
                return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
                #return HttpResponse("user is inactive");
        else:
            return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
            #return HttpResponse("user is none");
        
    else:
        return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
        #return HttpResponse("not a post");

@csrf_exempt 
def logout_handler(request):
    if (request.method == "POST"):
        logout(request)        
    return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

@csrf_exempt
def search(request):
    if (request.method == "GET"):
        navBarConfig = navBar()
        optionsList = navBarConfig[0]
        banner_url = navBarConfig[1]
        media_url = navBarConfig[2]
        
        getDict = request.GET
        query = getDict['search_val']
        
        if (getDict.has_key('search_genomes')):
            search_genomes = True
        else:
            search_genomes = False
        
        if (getDict.has_key('search_photos')):
            search_photos = True
        else:
            search_photos = False
        

        num_items_row = 5
        num_items_col = 3
        picsPerPage = num_items_row * num_items_col 
        numPicPages = PictureProps.objects.filter(type_id__imageType__exact = "database_photo").count()/picsPerPage + 1

        multiQuery = query.split("&")
        if (len(multiQuery) > 1):
            multiple_organisms = True
        else:
            multiple_organisms = False
        
        candidate_info = list() 
        picPageIndex = 1
        for subquery in multiQuery:
            splitQuery = subquery.strip().split(" ")     

            getFailed = False
            if (len(splitQuery) == 1):
                try:
                    candidates = Organism.objects.get(species=splitQuery[0])
                except(MultipleObjectsReturned):
                    candidates = Organism.objects.filter(species=splitQuery[0])
                    getFailed = True
                except(ObjectDoesNotExist):
                    candidates = []
                    getFailed = True
            elif(len(splitQuery) == 2): 
                try:            
                    candidates = Organism.objects.get(Q(species=splitQuery[1]) & Q(genus=splitQuery[0]))
                except(MultipleObjectsReturned):
                    candidates = []
                    getFailed = True
                except(ObjectDoesNotExist):
                    candidates = []
                    getFailed = True
            else:
                candidates = []
                getFailed = True
            
            gbrowse_entry = ""    
    
            if(getFailed == False):
                organism_ids = str(candidates.pk)
                try:
                    gbrowse_entry_preprocess = Landmark.objects.get(organism_id__exact=candidates.pk)
                    gbrowse_entry = candidates.genus.lower() + "_" + candidates.species.lower()
                except(ObjectDoesNotExist):
                    gbrowse_entry = ""
                candidate_info.append((candidates.common_name, str(candidates.pk), gbrowse_entry, picPageIndex))
            else:
                candidate_info.append(("No entries for " + subquery, -1,"",1))
        
        template = loader.get_template('mycoplasma_home/search.html')
        context = RequestContext(request, {
            'optionsList': optionsList,
            'banner_url': banner_url,
            'MEDIA_URL': media_url,
            'candidate_info' : candidate_info,
            'multiple_organisms' : multiple_organisms,
            'show_photos' : search_photos,
            'show_genomes' : search_genomes,
            'picsPerPage': picsPerPage,
            'numPages': numPicPages,
            'is_search' : True,
	    'SITE_URL' : settings.SITE_URL
        })
        return HttpResponse(template.render(context))
              
    return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

def administration(request):
    if request.user.is_authenticated():
        if request.user.is_staff == True:
            navBarConfig = navBar()
            optionsList = navBarConfig[0]
            banner_url = navBarConfig[1]
            media_url = navBarConfig[2]            

            template = loader.get_template('mycoplasma_home/administration.html')
            context = RequestContext(request, {
                'optionsList': optionsList,
                'banner_url': banner_url,
                'MEDIA_URL': media_url,
                'is_admin_page' : True,
		'SITE_URL' : settings.SITE_URL
            })
            return HttpResponse(template.render(context))
        else:
            return redirect('/dome/?add_login=True')
    else:
        return redirect('/dome/?add_login=True')

def image_manager(request):
    if request.user.is_authenticated():
        if request.user.is_staff == True:
            navBarConfig = navBar()
            optionsList = navBarConfig[0]
            banner_url = navBarConfig[1]
            media_url = navBarConfig[2]    

            pending_images = Image.objects.all()  
            all_mycoplasma = Organism.objects.filter(genus__exact='Mycoplasma')
            
            template = loader.get_template('mycoplasma_home/image_manager.html')
            context = RequestContext(request, {
                'optionsList': optionsList,
                'banner_url': banner_url,
                'MEDIA_URL': media_url,
                'pending_images': pending_images,
                'all_mycoplasma' : all_mycoplasma,
		'SITE_URL' : settings.SITE_URL
            })
            return HttpResponse(template.render(context))
        else:
            return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
    else:
        return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

@csrf_exempt
def delete_pending_image(request):
    if (request.method == "POST"):
        postDict = request.POST
        if (postDict.has_key('image_pk')):
            image_pk_preprocess = postDict['image_pk']
            image_pk = image_pk_preprocess[5:]
            image = Image.objects.get(pk__exact=image_pk)
            media_root = settings.MEDIA_ROOT;
            os.system("rm " + media_root + "/multiuploader_images/" + image.filename);
            image.delete()

            pending_images = Image.objects.order_by('-pk')
            template = loader.get_template('mycoplasma_home/image_slider.html')
            context = RequestContext(request, {
                'pending_images': pending_images,
		'SITE_URL' : settings.SITE_URL
            })
            return HttpResponse(template.render(context))
    return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

def get_slider(request):
    pending_images = Image.objects.order_by('-pk') 
            
    template = loader.get_template('mycoplasma_home/image_slider.html')
    context = RequestContext(request, {
        'pending_images': pending_images,
	'SITE_URL' : settings.SITE_URL
    })
    return HttpResponse(template.render(context))

@csrf_exempt
def move_pending_image(request):
    if (request.method == "POST"):
        postDict = request.POST
        if (postDict.has_key('image_pk') and postDict.has_key('description') and postDict.has_key('publication') 
                and postDict.has_key('alt_text') and postDict.has_key('organism')):
            image_pk_preprocess = postDict['image_pk']
            image_pk = image_pk_preprocess[5:]
            image = Image.objects.get(pk__exact=image_pk)
            media_root = settings.MEDIA_ROOT;

            os.system("mv " + media_root + "/multiuploader_images/" + image.filename + " " + media_root + "/pictures/" + image.filename)

            publication_var = "none" if postDict['publication'] == "" else postDict['publication']
            newPic = Pictures(description=postDict['description'],publication=publication_var, altText=postDict['alt_text'], imageName="pictures/" + image.filename)
            newPic.save()
    
            img_type = PictureTypes.objects.get(pk__exact=3)
            newPic_type = PictureProps(picture_id=newPic,type_id=img_type)
            newPic_type.save()

            organism_id_var = postDict['organism']
            organism = Organism.objects.get(pk__exact=organism_id_var)
            def_tag = PictureDefinitionTag(picture=newPic, organism_id=organism.pk, name=organism.common_name)
            def_tag.save()

            image.delete()

            pending_images = Image.objects.order_by('-pk')
            template = loader.get_template('mycoplasma_home/image_slider.html')
            context = RequestContext(request, {
                'pending_images': pending_images,
		'SITE_URL' : settings.SITE_URL
            })
            return HttpResponse(template.render(context))
    return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

def gbrowse_manager(request):
    if request.user.is_authenticated():
        if request.user.is_staff == True:
            navBarConfig = navBar()
            optionsList = navBarConfig[0]
            banner_url = navBarConfig[1]
            media_url = navBarConfig[2]    
 
            all_mycoplasma = Organism.objects.filter(genus__exact="Mycoplasma").order_by('species')
            template = loader.get_template('mycoplasma_home/gbrowse_manager.html')
            context = RequestContext(request, {
                'optionsList': optionsList,
                'banner_url': banner_url,
                'MEDIA_URL': media_url,
                'all_mycoplasma' : all_mycoplasma,
		'SITE_URL' : settings.SITE_URL
            })
            return HttpResponse(template.render(context))
        else:
            return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
    else:
        return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

@csrf_exempt
def genome_uploader(request):
    if (request.user.is_authenticated()):
        if (request.user.is_staff == True):
            if (request.POST.has_key('species') and request.POST.has_key('genbank_id')):
                organism_name = request.POST['species']
                genbank_id = request.POST['genbank_id']
                if (request.FILES.has_key('genbank_file')):
                    uploaded_file = request.FILES['genbank_file']				
                    genbank_file = GenomeUpload(genbank_file=uploaded_file, name=uploaded_file.name)
                    genbank_file.save()
                    
                    try:   
                        organism_exists = True                     
                        organism = Organism.objects.get(species=organism_name)                  
                    except ObjectDoesNotExist:        
                        organism_exists = False
                        next_id = Organism.objects.order_by('-organism_id')[0].organism_id + 1            
                        organism = Organism(organism_id=next_id, abbreviation="M. " + organism_name, genus="Mycoplasma", species=organism_name, common_name="Mycoplasma " + organism_name)                    
                        organism.save()
                    
                    landmark = Landmark(name=genbank_id, organism_id=organism.organism_id)
                    landmark.save()
                    
                    error = process_genome_file(genbank_file, organism, genbank_id, request, organism_exists)

                    if error[0]:
                        error_code = '0'
                        landmark.delete()
                        organism.delete()
                    else:
                        error_code = '1'
                    
                    error_msg = error_code + "," + str(error[1])

                    return HttpResponse(error_msg)
                else:
                    return HttpResponse('-1') 
            else:
                return HttpResponse('0')
        else:
            return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))
    else:
        return HttpResponseRedirect(reverse('mycoplasma_home.views.home'))

def process_genome_file(genbank_file, organism, genbank_id, request, organism_exists):
    error = (False,"",0)
    if (request.session.get(organism.species, None) == None):
        request.session[organism.species] = '0'
        session_index = 0
        session_array = ['0']
    else:
        request.session[organism] = request.session[organism.species] + ',0'
        session_index = len(request.session[organism.species].split(',')) - 1
        session_array = request.session[organism.species].split(',')

    static_root_absolute = settings.STATICFILES_DIRS[0]
    media_root_absolute = settings.MEDIA_ROOT + "/genbank_files/"
    
    extension_place = genbank_file.name.rfind(".")
    file_extension = genbank_file.name[extension_place + 1:]
    gff_name = media_root_absolute + genbank_file.name
    if (file_extension == "gbk"):
        args = ["bp_genbank2gff3.pl", "-noCDS", media_root_absolute + genbank_file.name, "--outdir", media_root_absolute]
        error = run_subproc(args, 0, request, session_array, session_index, organism)

        gff_name = media_root_absolute + genbank_file.name + ".gff"

        # remove the genbank file to deal with the gff only
        os.system("rm " + media_root_absolute + genbank_file.name)
        genbank_file.delete()
    elif (file_extension == "gff"):
        gff_name = media_root_absolute + genbank_file.name
        genbank_file.delete()
    else:
        error = (True, "Please enter a genbank or gff file with the extension .gff or .gbk", 0)
        gff_name = media_root_absolute + genbank_file.name
    '''
    if (not error[0]):
        if(os.getenv("GMOD_ROOT") == None):
            os.putenv("GMOD_ROOT", "/usr/local/gmod/")
        args = ["gmod_gff3_preprocessor.pl","--outfile", gff_name, "--gfffile", gff_name]
        error = run_subproc(args, 2, request, session_array, session_index, organism.species) 
    '''
    if (not error[0]):
        '''args = ["python", static_root_absolute + "/python_scripts/prepGFFGO.py", "--file", gff_name, "--outfile", 
		gff_name + ".sorted.colored", "--accession", genbank_id]
        error = run_subproc(args, 3, request, session_array, session_index, organism.species)
	'''
	gffRewriter = GFFRewriter(filename=gff_name, outfile=gff_name+".sorted.prepared" , accession=genbank_id)
	
	gffRewriter.addUnknownCvTerms({
		'user' : settings.DATABASES['chado']['USER'], 
		'password' : settings.DATABASES['chado']['PASSWORD'], 
		'db' : settings.DATABASES['chado']['NAME']
	})

	gffRewriter.addColor({
		'user' : settings.DATABASES['chado']['USER'],
		'password' : settings.DATABASES['chado']['PASSWORD'],
		'db' : 'MyGO'
	})

	error = gffRewriter.getError(3)
    if (not error[0]):
        organism_name = organism.species

        # need to upload to a temporary organism to maintain database integrity
        if (organism_exists):
            organism_name += "_temp"
            next_id = Organism.objects.order_by('-organism_id')[0].organism_id + 1            
            temp_organism = Organism(organism_id=next_id, abbreviation="M. " + organism_name, genus="Mycoplasma", species=organism_name, common_name="Mycoplasma " + organism_name)                    
            temp_organism.save()

        args = ["gmod_bulk_load_gff3.pl", "--organism", "Mycoplasma " + organism_name, "--gfffile", gff_name + ".sorted.prepared", "--dbname", settings.DATABASES['chado']['NAME'], "--dbuser", settings.DATABASES['chado']['USER'], "--dbpass", settings.DATABASES['chado']['PASSWORD'], "--random_tmp_dir"]
        error = run_subproc(args, 4, request, session_array, session_index, organism.species)

        if (not error[0] and organism_exists):
            # since there was no error in the upload, we remove the old organism and accept the new organism
            replace_name = organism.species
            organism.delete()
            temp_organism.update(species=replace_name)
            temp_organism.save()

    # the gff file should be deleted no matter what
    #os.system("rm " + gff_name)
    #os.system("rm " + gff_name + ".sorted")
    #os.system("rm " + gff_name + ".sorted.fasta")
    #os.system("rm " + gff_name + ".sorted.colored")


    # set the status of the upload process to 5
    session_array[session_index] = '5'
    request.session[organism.species] = ",".join(session_array)
    
    if (not error[0]):
        if (not organism_exists):        
            error = create_new_gbrowse_entry(organism.species, genbank_id)

    # set the status of the upload process to 6
    session_array[session_index] = '6'
    request.session[organism.species] = ",".join(session_array)
    
    return error

def create_new_gbrowse_entry(organism, genbank_id): 
    try:
        template_conf = open("/etc/gbrowse2/mycoplasma_template.conf", 'r')
        conf_lines = template_conf.readlines()
        template_conf.close()
    except:
        return (True, "Could not find the template file for adding the new entry to GBrowse", 6)
    
    
    i = 0
    found_dbargs = False
    found_examples = False
    found_landmark = False
    while((not found_examples or not found_landmark or not found_dbargs) and i < len(conf_lines)):
        split_line = conf_lines[i].split('=')
        if(split_line[0].strip() == "examples" and not found_examples):
            conf_lines[i] = "examples = " + genbank_id
            found_examples = True
        elif(split_line[0].strip() == "initial landmark" and not found_landmark):
            conf_lines[i] = "initial landmark = " + genbank_id + ":1..50000"
            found_landmark = True
        elif(conf_lines[i].find('-organism "Mycoplasma') > -1 and not found_dbargs):
            conf_lines[i] = conf_lines[i].replace('pneumoniae', organism)
            found_db_args = True
        i += 1

    try:
        new_conf = open("/etc/gbrowse2/mycoplasma_" + organism + ".conf", 'w')
        new_conf.writelines(conf_lines)
        new_conf.close()
    except:
        return (True, "Could not create a new configuration file for Mycoplasma " + organism, 6)

    try:
        gbrowse_conf = open("/etc/gbrowse2/GBrowse.conf", 'a')
        append_str = "\n[mycoplasma_" + organism + "]\ndescription  = Mycoplasma " + organism + "\npath          = mycoplasma_" + organism + ".conf"

        gbrowse_conf.write(append_str)
        gbrowse_conf.close()
    except:
        return (True, "Could not add the entry to the main GBrowse configuration.", 6)
    
    return (False, "", 6)

def run_subproc(args, proc_num, request, session_array, session_index, organism):
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output = proc.communicate()
    
    # edit the session variable to show that this process is running
    session_array[session_index] = str(proc_num)
    request.session[organism] = ",".join(session_array)

    if proc.returncode != 0:
        return (True, output[1], proc_num)
    else:
        return (False, output[0], proc_num)


