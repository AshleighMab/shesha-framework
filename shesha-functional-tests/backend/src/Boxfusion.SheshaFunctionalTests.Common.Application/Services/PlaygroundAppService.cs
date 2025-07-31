﻿using Abp.Domain.Repositories;
using Boxfusion.SheshaFunctionalTests.Common.Domain.Domain;
using Abp.Localization;
using Microsoft.AspNetCore.Routing;
using Newtonsoft.Json;
using Shesha;
using Shesha.Domain;
using Shesha.Extensions;
using Shesha.Services;
using Shesha.Services.Urls;

namespace Boxfusion.SheshaFunctionalTests.Common.Application.Services
{
    public class PlaygroundAppService: SheshaAppServiceBase
    {
        private readonly IRepository<TestClass, Guid> _testClassRepo;

        public PlaygroundAppService(
            IRepository<TestClass, Guid> testClassRepo
        )
        {
            _testClassRepo = testClassRepo;
        }

        public async Task TestJsonWithGenericEntityReference(Guid id)
        {
            var test = await _testClassRepo.GetAsync(id);
            if (test.JsonProp is TestJsonWithGenericEntityReference json)
            {
                var entity = json.Entity;
                var person = (Person)json.Entity;
            }
        }

        public async Task<string> TestAuditAsync()
        {
            var repoP = IocManager.Resolve<IRepository<Person, Guid>>();
            var repoL = IocManager.Resolve<IRepository<Abp.Localization.ApplicationLanguage, int>>();

            var person = repoP.GetAll().FirstOrDefault(x => x.Id == Guid.Parse("D519B92F-86E9-4F0F-8DF4-00AAE8A43158"));

            var ll = repoL.GetAll().ToList();
            var l = ll.FirstOrDefault(x => !person.PreferredLanguages.Select(z => z.Id).Contains(x.Id));

            person.PreferredLanguages.Add(l);

            await repoP.InsertOrUpdateAsync(person);

            return "Ok";
        }

        public async Task<string> TestFileVersionUrl(Guid id) 
        {
            var repo = IocManager.Resolve<IRepository<StoredFileVersion, Guid>>();
            var version = await repo.GetAsync(id);

            var linkGeneratorContext = StaticContext.IocManager.Resolve<ILinkGeneratorContext>();
            if (linkGeneratorContext == null)
                throw new Exception("linkGeneratorContext is null");
            if (linkGeneratorContext.State == null)
                throw new Exception("linkGeneratorContext.State is null");

            var linkGenerator = StaticContext.IocManager.Resolve<LinkGenerator>();
            if (linkGenerator == null)
                throw new Exception("linkGenerator is null");

            var url = version.GetFileVersionUrl();
            return url;
        }


        public async Task<string> TestLinkState() 
        {
            var linkGeneratorContext = StaticContext.IocManager.Resolve<ILinkGeneratorContext>();
            if (linkGeneratorContext == null)
                throw new Exception("linkGeneratorContext is null");
            if (linkGeneratorContext.State == null)
                throw new Exception("linkGeneratorContext.State is null");

            return JsonConvert.SerializeObject(linkGeneratorContext.State);
        }        
    }
}
