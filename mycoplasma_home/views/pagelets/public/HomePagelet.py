'''
	Pagelet for the Home Page
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.PageletBase import PageletBase
from mycoplasma_home.models import Organism, OrganismWithImages, OrganismWithGenome, OrganismWithTags

class HomePagelet(PageletBase):
	'''
		Renders the center of the home page		
	
		Params: request -- the Django request object with the POST & GET args
		
		Returns: Dictionary of arguments for rendering this pagelet
	'''
	def doProcessRender(self, request):
		self.setLayout('public/home.html')

		allMycoplasma = Organism.objects.filter(genus__exact="Mycoplasma").order_by('species')
		allGenomes = OrganismWithGenome.objects.filter(genus__exact="Mycoplasma").order_by('species')
		allImages = OrganismWithImages.objects.filter(genus__exact="Mycoplasma").order_by('species')
		allTags = OrganismWithTags.objects.filter(genus__exact="Mycoplasma").order_by('species')
		
		return {
			'all_mycoplasma' : allMycoplasma,
			'all_genomes' : allGenomes,
			'all_images' : allImages,
			'all_tags' : allTags
		}
