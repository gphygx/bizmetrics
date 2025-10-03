import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, Building } from "lucide-react";

export default function Contacts() {
  const contacts = [
    { 
      id: 1, 
      name: "Sarah Johnson", 
      email: "sarah.j@acmecorp.com",
      phone: "+1 (555) 123-4567",
      company: "Acme Corporation",
      role: "CEO",
      type: "client",
      status: "active"
    },
    { 
      id: 2, 
      name: "Michael Chen", 
      email: "m.chen@techstart.com",
      phone: "+1 (555) 234-5678",
      company: "TechStart Inc",
      role: "CTO",
      type: "client",
      status: "active"
    },
    { 
      id: 3, 
      name: "Emily Davis", 
      email: "emily@globalsolutions.com",
      phone: "+1 (555) 345-6789",
      company: "Global Solutions",
      role: "Finance Director",
      type: "client",
      status: "active"
    },
    { 
      id: 4, 
      name: "David Wilson", 
      email: "david.w@innovationlabs.com",
      phone: "+1 (555) 456-7890",
      company: "Innovation Labs",
      role: "VP Operations",
      type: "partner",
      status: "active"
    },
    { 
      id: 5, 
      name: "Jennifer Brown", 
      email: "j.brown@digitalventures.com",
      phone: "+1 (555) 567-8901",
      company: "Digital Ventures",
      role: "Head of Product",
      type: "client",
      status: "inactive"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Contacts</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage your business contacts and relationships
          </p>
        </div>
        <Button data-testid="button-add-contact">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-contacts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-contacts">48</div>
            <p className="text-xs text-muted-foreground">All contacts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-clients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-clients-count">32</div>
            <p className="text-xs text-muted-foreground">Active client contacts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-partners">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-partners-count">12</div>
            <p className="text-xs text-muted-foreground">Business partners</p>
          </CardContent>
        </Card>

        <Card data-testid="card-vendors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-vendors-count">4</div>
            <p className="text-xs text-muted-foreground">Service providers</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-contacts-list">
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>Your business network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`contact-${contact.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" data-testid={`contact-name-${contact.id}`}>
                        {contact.name}
                      </p>
                      <Badge variant={contact.status === "active" ? "default" : "secondary"} data-testid={`contact-status-${contact.id}`}>
                        {contact.status}
                      </Badge>
                      <Badge variant="outline" data-testid={`contact-type-${contact.id}`}>
                        {contact.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span data-testid={`contact-company-${contact.id}`}>{contact.company}</span>
                      </div>
                      <span>•</span>
                      <span data-testid={`contact-role-${contact.id}`}>{contact.role}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span data-testid={`contact-email-${contact.id}`}>{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span data-testid={`contact-phone-${contact.id}`}>{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-view-${contact.id}`}>
                    View
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-edit-${contact.id}`}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
