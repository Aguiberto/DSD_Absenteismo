"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# imports do django
from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

# imports externos
from spyne.application import Application
from spyne.protocol.soap import Soap11
from spyne.server.django import DjangoApplication

# imports local
from absenteismo.services import AbsenteismoService

# Registra a classe de serviço SOAP e define os protocolos usados para ler e responder XML.
spyne_app = Application(
    services=[AbsenteismoService],
    tns = "absenteismo.soap",
    in_protocol = Soap11(validator="lxml"),
    out_protocol = Soap11()
)

django_spyne_app = DjangoApplication(spyne_app)

# Publica o endpoint SOAP em /soap/absenteismo/; esse endereço também serve o WSDL com ?wsdl.
urlpatterns = [
    path('admin/', admin.site.urls),
    path('soap/absenteismo/',csrf_exempt(django_spyne_app)),
]
