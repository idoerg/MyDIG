'''
	Pagelet for the Home Page
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.PageletBase import PageletBase
from mycoplasma_home.models import Organism

class HomePagelet(PageletBase):
	'''
		Renders the center of the home page		
	
		Params: request -- the Django request object with the POST & GET args
		
		Returns: Dictionary of arguments for rendering this pagelet
	'''
	def doProcessRender(self, request):
		self.setLayout('public/home.html')

		all_mycoplasma = Organism.objects.filter(genus__exact="Mycoplasma").order_by('species')

		return {
			'all_mycoplasma' : all_mycoplasma
		}
